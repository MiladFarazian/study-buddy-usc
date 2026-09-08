/**
 * OAuth 2.0 redirect handling.
 *
 * These tests are mostly about refusals. The happy path is easy; the value is
 * in rejecting forged, replayed, and error responses before a code is spent.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { OAuthClient, OAuthError } from "../oauthClient";
import { computeCodeChallenge, createTransactionStore } from "../pkce";

const config = {
  provider: "zoom",
  authorizationEndpoint: "https://zoom.us/oauth/authorize",
  clientId: "client-abc",
  scopes: ["meeting:write", "user:read"],
  redirectUri: "https://app.test/integrations/zoom/callback",
};

const tokens = { accessToken: "at-1", refreshToken: "rt-1", expiresIn: 3600 };

function makeClient(exchange = vi.fn().mockResolvedValue(tokens)) {
  const store = createTransactionStore(sessionStorage);
  return { client: new OAuthClient(config, exchange, store), exchange, store };
}

beforeEach(() => sessionStorage.clear());

describe("createAuthorizationRequest", () => {
  it("builds a spec-compliant authorization URL", async () => {
    const { client } = makeClient();
    const { url, transaction } = await client.createAuthorizationRequest();
    const params = new URL(url).searchParams;

    expect(params.get("response_type")).toBe("code");
    expect(params.get("client_id")).toBe(config.clientId);
    expect(params.get("redirect_uri")).toBe(config.redirectUri);
    expect(params.get("scope")).toBe("meeting:write user:read");
    expect(params.get("state")).toBe(transaction.state);
    expect(params.get("code_challenge_method")).toBe("S256");
    expect(params.get("code_challenge")).toBe(
      await computeCodeChallenge(transaction.codeVerifier),
    );
  });

  it("never puts the verifier in the URL", async () => {
    // The whole point of PKCE is that the secret stays in the browser; sending
    // it in the authorization request would make the exchange forgeable.
    const { client } = makeClient();
    const { url, transaction } = await client.createAuthorizationRequest();
    expect(url).not.toContain(transaction.codeVerifier);
  });

  it("persists the transaction before the caller navigates", async () => {
    const { client, store } = makeClient();
    const { transaction } = await client.createAuthorizationRequest("/schedule");

    const saved = store.take(transaction.state);
    expect(saved?.codeVerifier).toBe(transaction.codeVerifier);
    expect(saved?.returnTo).toBe("/schedule");
  });

  it("appends to an endpoint that already has a query string", async () => {
    const { client } = makeClient();
    const withQuery = new OAuthClient(
      { ...config, authorizationEndpoint: "https://idp.test/authorize?tenant=usc" },
      vi.fn(),
      createTransactionStore(sessionStorage),
    );
    const { url } = await withQuery.createAuthorizationRequest();

    expect(url).toContain("?tenant=usc&");
    expect(new URL(url).searchParams.get("tenant")).toBe("usc");
    void client;
  });
});

describe("handleRedirectCallback", () => {
  it("exchanges a valid code for tokens", async () => {
    const { client, exchange } = makeClient();
    const { transaction } = await client.createAuthorizationRequest();

    const result = await client.handleRedirectCallback(
      `?code=auth-code-1&state=${transaction.state}`,
    );

    expect(result.tokens).toEqual(tokens);
    expect(exchange).toHaveBeenCalledWith({
      provider: "zoom",
      code: "auth-code-1",
      codeVerifier: transaction.codeVerifier,
      redirectUri: config.redirectUri,
    });
  });

  it("rejects a forged state without spending the code", async () => {
    const { client, exchange } = makeClient();
    await client.createAuthorizationRequest();

    // Login CSRF: an attacker feeds us their own authorization code.
    await expect(
      client.handleRedirectCallback("?code=attacker-code&state=made-up"),
    ).rejects.toThrow(OAuthError);

    expect(exchange).not.toHaveBeenCalled();
  });

  it("rejects a replayed callback", async () => {
    const { client } = makeClient();
    const { transaction } = await client.createAuthorizationRequest();
    const search = `?code=auth-code-1&state=${transaction.state}`;

    await client.handleRedirectCallback(search);
    await expect(client.handleRedirectCallback(search)).rejects.toThrow(
      /already been used|expired/i,
    );
  });

  it("surfaces a provider error instead of exchanging", async () => {
    const { client, exchange } = makeClient();
    await client.createAuthorizationRequest();

    await expect(
      client.handleRedirectCallback(
        "?error=access_denied&error_description=User%20declined",
      ),
    ).rejects.toMatchObject({ code: "access_denied", description: "User declined" });

    expect(exchange).not.toHaveBeenCalled();
  });

  it("checks the provider error before state, so a denial reads correctly", async () => {
    // A user declining consent should be told that, not "invalid state".
    const { client } = makeClient();
    await expect(
      client.handleRedirectCallback("?error=access_denied"),
    ).rejects.toMatchObject({ code: "access_denied" });
  });

  it("rejects a response with no state at all", async () => {
    const { client } = makeClient();
    await expect(
      client.handleRedirectCallback("?code=auth-code-1"),
    ).rejects.toThrow(/missing state/i);
  });

  it("rejects a valid state that carries no code", async () => {
    const { client, exchange } = makeClient();
    const { transaction } = await client.createAuthorizationRequest();

    await expect(
      client.handleRedirectCallback(`?state=${transaction.state}`),
    ).rejects.toThrow(/missing the code/i);
    expect(exchange).not.toHaveBeenCalled();
  });

  it("accepts URLSearchParams as well as a string", async () => {
    const { client } = makeClient();
    const { transaction } = await client.createAuthorizationRequest();

    const params = new URLSearchParams({
      code: "auth-code-1",
      state: transaction.state,
    });
    await expect(client.handleRedirectCallback(params)).resolves.toMatchObject({
      tokens,
    });
  });
});
