/**
 * SAML 2.0 federation and home-realm discovery.
 *
 * StudyBuddy is USC-only, and USC (like most universities) runs Shibboleth as
 * a SAML identity provider. Google sign-in with `hd=usc.edu` covers students
 * with Google-backed accounts; SAML covers the rest and is what an institution
 * expects before it will endorse an app — the university keeps control of
 * authentication, MFA, and deprovisioning.
 *
 * Supabase Auth is the service provider. `signInWithSSO` redirects to the IdP,
 * the IdP posts a signed assertion back to Supabase's ACS endpoint, and the
 * user returns to our callback with an authorization code, which the PKCE flow
 * then exchanges. Registering the IdP is a one-time admin step — see
 * `docs/auth-sso.md` and `supabase/functions/sso-admin`.
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Email domains federated through SAML.
 *
 * USC issues @usc.edu to everyone; alumni and some units use the others. A
 * domain listed here must also be registered as an SSO domain in Supabase, or
 * `signInWithSSO` returns "no such SSO provider".
 */
export const SAML_DOMAINS = ["usc.edu"] as const;

/** Domains allowed in at all, whether via SAML or Google. */
export const ALLOWED_EMAIL_DOMAINS = ["usc.edu"] as const;

export type SsoMethod = "saml" | "google" | "unsupported";

/** Extracts the domain from an email address, lowercased. */
export function emailDomain(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf("@");
  if (at <= 0 || at === trimmed.length - 1) return null;
  const domain = trimmed.slice(at + 1);
  return domain.includes(".") ? domain : null;
}

/**
 * Home-realm discovery: decides which identity provider an email belongs to.
 *
 * Subdomains federate with their parent, so `@marshall.usc.edu` routes to the
 * `usc.edu` IdP. The suffix check is anchored on a dot — a bare `endsWith`
 * would hand `notusc.edu` to USC's IdP.
 */
export function resolveSsoMethod(email: string): {
  method: SsoMethod;
  domain: string | null;
} {
  const domain = emailDomain(email);
  if (!domain) return { method: "unsupported", domain: null };

  const samlDomain = SAML_DOMAINS.find((candidate) =>
    domain === candidate || domain.endsWith(`.${candidate}`)
  );
  if (samlDomain) return { method: "saml", domain: samlDomain };

  const allowed = ALLOWED_EMAIL_DOMAINS.find((candidate) =>
    domain === candidate || domain.endsWith(`.${candidate}`)
  );
  if (allowed) return { method: "google", domain };

  return { method: "unsupported", domain };
}

export interface SsoSignInResult {
  success: boolean;
  error?: string;
  /** Present when the caller must perform the redirect itself. */
  url?: string;
}

/**
 * Starts a SAML login for an email domain.
 *
 * supabase-js applies PKCE to the code that comes back from the IdP, because
 * the client is configured with `flowType: "pkce"`.
 */
export async function signInWithSaml(
  domain: string,
  redirectTo: string,
): Promise<SsoSignInResult> {
  const { data, error } = await supabase.auth.signInWithSSO({
    domain,
    options: { redirectTo },
  });

  if (error) {
    console.error("SAML sign-in failed:", error.message);
    return { success: false, error: error.message };
  }

  if (!data?.url) {
    return {
      success: false,
      error: "The identity provider did not return a redirect URL.",
    };
  }

  return { success: true, url: data.url };
}

/**
 * Routes an email to the right provider and returns the redirect target.
 *
 * Google is started by supabase-js itself (it navigates), so only the SAML
 * branch hands a URL back to the caller.
 */
export async function signInWithEmailDomain(
  email: string,
  redirectTo: string,
): Promise<SsoSignInResult & { method: SsoMethod }> {
  const { method, domain } = resolveSsoMethod(email);

  if (method === "unsupported" || !domain) {
    return {
      method: "unsupported",
      success: false,
      error: "StudyBuddy is open to USC accounts only. Use your @usc.edu email.",
    };
  }

  if (method === "saml") {
    return { method, ...(await signInWithSaml(domain, redirectTo)) };
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      // A hint, not a control: `hd` shapes the account chooser but is trivially
      // removed from the URL, so the domain is re-checked on return.
      queryParams: { hd: domain, login_hint: email },
    },
  });

  if (error) {
    console.error("Google sign-in failed:", error.message);
    return { method, success: false, error: error.message };
  }

  return { method, success: true };
}

/**
 * Re-checks the domain after authentication.
 *
 * Whatever the IdP asserts, membership is enforced on our side: `hd` and
 * `login_hint` are request parameters an attacker controls.
 */
export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const domain = emailDomain(email);
  if (!domain) return false;
  return ALLOWED_EMAIL_DOMAINS.some((candidate) =>
    domain === candidate || domain.endsWith(`.${candidate}`)
  );
}
