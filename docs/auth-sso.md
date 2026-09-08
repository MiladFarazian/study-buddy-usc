# Authentication: OAuth 2.0 + PKCE and SAML federation

StudyBuddy authenticates USC students two ways, both landing on the same
authorization-code flow:

| Path | Grant | Who it serves |
|---|---|---|
| Google Workspace (`hd=usc.edu`) | OAuth 2.0 auth code + PKCE | Students with Google-backed USC accounts |
| USC Shibboleth (SAML 2.0) | SAML → Supabase ACS → auth code + PKCE | Everyone the university federates |

An email address decides which one runs — see "Home-realm discovery" below.

## Why PKCE

The client used to run the **implicit** flow, which returns the access token in
the URL fragment. That token lands in browser history, is readable by any script
on the page, and can leak through a `Referer` header. It is no longer
recommended for browser apps (OAuth 2.0 Security BCP; implicit is removed
outright in OAuth 2.1).

The app now runs **authorization code + PKCE** (RFC 7636). The provider returns
a single-use `code`, which is worthless without the `code_verifier` held in the
originating tab. Concretely:

1. The client generates a 256-bit random `code_verifier` and sends only
   `code_challenge = BASE64URL(SHA256(verifier))` with `code_challenge_method=S256`.
2. The identity provider redirects back with `?code=...&state=...`.
3. `/auth/callback` calls `exchangeCodeForSession(code)`, which submits the
   verifier. The server recomputes the hash and rejects a mismatch.

Only `S256` is implemented. RFC 7636 also allows `plain`, where the challenge
*is* the verifier — that offers no protection against anyone who observed the
authorization request, and supporting it invites a downgrade.

`state` is separate from PKCE and both are required: PKCE proves the code came
back to the client that asked for it, `state` proves the *user* started the
request. Without `state` an attacker can feed you their authorization code and
silently sign you into their account (login CSRF).

### Where the code lives

| Concern | File |
|---|---|
| Verifier/challenge/state/nonce generation, transaction storage | `src/lib/auth/pkce.ts` |
| Generic OAuth 2.0 public-client flow for third-party APIs | `src/lib/auth/oauthClient.ts` |
| Home-realm discovery and SAML entry points | `src/lib/auth/sso.ts` |
| Flow selection (`flowType: 'pkce'`) | `src/integrations/supabase/client.ts` |
| Redirect handling and code exchange | `src/pages/AuthCallback.tsx` |
| IdP administration (service-role) | `supabase/functions/sso-admin/index.ts` |

For Supabase login, supabase-js performs PKCE internally once `flowType` is set.
`src/lib/auth/pkce.ts` and `oauthClient.ts` implement it directly for
third-party connections — Zoom, Google Calendar — where Supabase is not in the
loop. There the browser holds the verifier and an edge function holds the client
secret, which is the split RFC 8252 §8.4 asks for: a public client never ships a
secret, and the token exchange still authenticates.

### Transaction storage

In-flight transactions live in `sessionStorage`, keyed `pkce.tx.<state>`:

- **sessionStorage, not localStorage** — the verifier is a bearer secret for the
  duration of one redirect. sessionStorage is scoped to the tab and cleared when
  it closes; localStorage would persist verifiers to disk and share them with
  every other tab on the origin.
- **Single-use** — `take(state)` reads *and* removes. A replayed callback finds
  nothing and is refused.
- **Expiring** — 10 minutes by default. An abandoned redirect cannot be resumed
  an hour later.

## Home-realm discovery

`resolveSsoMethod(email)` in `src/lib/auth/sso.ts` maps an email domain to a
provider:

```
student@usc.edu            -> saml   (usc.edu)
mba@marshall.usc.edu       -> saml   (usc.edu)   subdomains federate upward
someone@gmail.com          -> unsupported
attacker@notusc.edu        -> unsupported
```

The suffix test is anchored on a dot (`domain === "usc.edu" || domain.endsWith(".usc.edu")`).
A bare `endsWith("usc.edu")` would route `notusc.edu` and `evil-usc.edu` to
USC's identity provider. `src/lib/auth/__tests__/sso.test.ts` covers those cases.

Domain membership is enforced **again** after authentication, in
`AuthCallback.tsx` via `isAllowedEmail(session.user.email)`. Google's `hd`
parameter is a hint that shapes the account chooser, not a control — a user can
strip it from the URL. Anything the IdP asserts is re-checked on our side.

## Registering the USC SAML identity provider

One-time, and it needs a service-role key, so it runs through the guarded
`sso-admin` edge function rather than the browser.

### 1. Give USC IAM our service-provider details

Supabase acts as the SAML service provider:

- **SP metadata / entity ID**: `https://<project-ref>.supabase.co/auth/v1/sso/saml/metadata`
- **ACS (Assertion Consumer Service) URL**: `https://<project-ref>.supabase.co/auth/v1/sso/saml/acs`
- **NameID format**: `urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress`
- **Required attributes**: `mail`, `givenName`, `sn`; `eduPersonPrincipalName`
  strongly preferred as the stable identifier — `mail` changes when a student
  changes their name, `eppn` does not.

### 2. Register their IdP

```bash
curl -X POST "https://<project-ref>.supabase.co/functions/v1/sso-admin" \
  -H "Authorization: Bearer <an admin user's access token>" \
  -H "Content-Type: application/json" \
  -d '{
        "action": "create",
        "domains": ["usc.edu"],
        "metadataUrl": "https://shibboleth.usc.edu/idp/shibboleth"
      }'
```

Prefer `metadataUrl` over `metadataXml`: Supabase re-reads the URL, so a
certificate rollover at USC does not silently break login at 3am. Use
`metadataXml` only for an IdP with no published metadata endpoint.

The function defaults `attribute_mapping` to the eduPerson set, listing both
OIDs and friendly names because Shibboleth deployments differ in which they
release. Override it by passing `attributeMapping`.

### 3. Add the domain to the app

Add it to `SAML_DOMAINS` in `src/lib/auth/sso.ts`. A domain listed there but not
registered in Supabase makes `signInWithSSO` fail with "no such SSO provider".

### 4. Allowlist the redirect

Add `https://<your-domain>/auth/callback` to **Authentication → URL
Configuration → Redirect URLs** in the Supabase dashboard. Providers reject a
token exchange whose `redirect_uri` differs from the one the code was issued
for, so every entry point uses the single constant `AUTH_CALLBACK_PATH` in
`src/hooks/useAuthMethods.ts`.

Other `sso-admin` actions: `list`, `get`, `update`, `delete` — all requiring an
`admin` row in `user_roles`.

## The callback route

`/auth/callback` **and** `/auth-callback` both resolve to `AuthCallback`.

They diverged: `useAuthMethods` sent `redirect_uri` as `/auth/callback` while
`App.tsx` only routed `/auth-callback`, so the redirect landed on the 404 route.
The implicit flow hid it — `detectSessionInUrl` picked the token out of the
fragment on whatever route it landed on, so users were signed in but staring at
"Not Found". Under PKCE the code has to be exchanged by the callback component,
so this had to be fixed. Both spellings are routed because links to the old path
are already in the wild.

## Testing

```bash
npm run test -- src/lib/auth      # 40 tests
```

Covers the RFC 7636 Appendix B test vector, verifier charset and entropy,
single-use and expiry of transactions, forged/replayed/missing `state`, and
provider error responses. The `state` tests assert that the token exchange is
**not** called when validation fails — rejecting after spending the code would
defeat the purpose.
