/**
 * OAuth 2.0 authorization-code client for public clients (RFC 6749 + RFC 7636).
 *
 * Used for third-party connections the app makes on the user's behalf — Zoom,
 * Google Calendar — where Supabase Auth is not in the loop. Supabase's own
 * login uses the same grant, handled inside supabase-js once `flowType: "pkce"`
 * is set (see `src/integrations/supabase/client.ts`).
 *
 * The browser never holds a client secret. It generates the PKCE verifier and
 * posts the code to an edge function, which adds the secret and performs the
 * token exchange. That split is what RFC 8252 §8.4 and the OAuth 2.0 Security
 * BCP ask for: confidential credentials stay server-side, and the code is
 * useless to anyone who intercepts the redirect.
 */

import {
  beginPkceTransaction,
  createTransactionStore,
  type PkceTransaction,
  type TransactionStore,
} from "./pkce";

export interface OAuthProviderConfig {
  /** Identifier the token-exchange function uses to pick provider secrets. */
  provider: string;
  authorizationEndpoint: string;
  clientId: string;
  scopes: string[];
  redirectUri: string;
  /** Request an OIDC nonce alongside PKCE. */
  useNonce?: boolean;
  /** Provider-specific extras, e.g. `{ access_type: "offline" }`. */
  extraAuthorizationParams?: Record<string, string>;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  scope?: string;
  tokenType?: string;
}

/** Carries the OAuth 2.0 `error` code so callers can branch on it. */
export class OAuthError extends Error {
  readonly code: string;
  readonly description?: string;

  constructor(code: string, description?: string) {
    super(description ? `${code}: ${description}` : code);
    this.name = "OAuthError";
    this.code = code;
    this.description = description;
  }
}

/**
 * Redeems an authorization code for tokens.
 *
 * Implemented by an edge function, not the browser: the exchange needs the
 * client secret, and shipping that to a public client would defeat the point.
 */
export type TokenExchange = (input: {
  provider: string;
  code: string;
  codeVerifier: string;
  redirectUri: string;
}) => Promise<OAuthTokens>;

export class OAuthClient {
  #config: OAuthProviderConfig;
  #store: TransactionStore;
  #exchange: TokenExchange;

  constructor(
    config: OAuthProviderConfig,
    exchange: TokenExchange,
    store: TransactionStore = createTransactionStore(),
  ) {
    this.#config = config;
    this.#exchange = exchange;
    this.#store = store;
  }

  /**
   * Builds the authorization URL and records the matching transaction.
   *
   * The transaction is saved *before* the caller navigates away — if the
   * redirect happened first, the callback could land with no verifier to
   * match it.
   */
  async createAuthorizationRequest(
    returnTo?: string,
  ): Promise<{ url: string; transaction: PkceTransaction }> {
    this.#store.clearExpired();

    const { transaction, pair } = await beginPkceTransaction({
      provider: this.#config.provider,
      redirectUri: this.#config.redirectUri,
      returnTo,
      withNonce: this.#config.useNonce,
    });

    this.#store.save(transaction);

    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.#config.clientId,
      redirect_uri: this.#config.redirectUri,
      scope: this.#config.scopes.join(" "),
      state: transaction.state,
      code_challenge: pair.codeChallenge,
      code_challenge_method: pair.codeChallengeMethod,
      ...(transaction.nonce ? { nonce: transaction.nonce } : {}),
      ...this.#config.extraAuthorizationParams,
    });

    const separator = this.#config.authorizationEndpoint.includes("?")
      ? "&"
      : "?";

    return {
      url: `${this.#config.authorizationEndpoint}${separator}${params}`,
      transaction,
    };
  }

  /**
   * Validates a redirect and exchanges the code for tokens.
   *
   * Order matters: the provider's `error` response is checked first, then
   * `state`, and only then is the code redeemed. Validating state after the
   * exchange would mean burning a code on a request we were about to reject.
   */
  async handleRedirectCallback(
    search: string | URLSearchParams,
  ): Promise<{ tokens: OAuthTokens; transaction: PkceTransaction }> {
    const params = typeof search === "string"
      ? new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
      : search;

    const error = params.get("error");
    if (error) {
      throw new OAuthError(error, params.get("error_description") ?? undefined);
    }

    const state = params.get("state");
    if (!state) {
      throw new OAuthError(
        "invalid_request",
        "Authorization response is missing state.",
      );
    }

    // A single-use read: an absent transaction means the state was forged,
    // already consumed, or expired. All three are refusals.
    const transaction = this.#store.take(state);
    if (!transaction) {
      throw new OAuthError(
        "invalid_state",
        "No matching authorization request. It may have expired or already been used.",
      );
    }

    const code = params.get("code");
    if (!code) {
      throw new OAuthError(
        "invalid_request",
        "Authorization response is missing the code.",
      );
    }

    const tokens = await this.#exchange({
      provider: transaction.provider,
      code,
      codeVerifier: transaction.codeVerifier,
      redirectUri: transaction.redirectUri,
    });

    return { tokens, transaction };
  }
}
