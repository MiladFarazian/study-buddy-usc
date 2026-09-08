/**
 * PKCE primitives (RFC 7636).
 *
 * PKCE closes the authorization-code interception attack: the client commits to
 * a secret up front by sending only its hash (`code_challenge`), then proves
 * possession at token exchange by sending the secret itself (`code_verifier`).
 * An attacker who steals the redirect — from browser history, a referrer
 * header, a malicious app claiming the same custom scheme — holds a code they
 * cannot redeem.
 *
 * Only S256 is implemented. RFC 7636 also allows `plain`, where the challenge
 * *is* the verifier; that provides no protection at all against an attacker who
 * saw the authorization request, and a server offering it is a downgrade
 * target. See RFC 8252 §8.1.
 */

/** RFC 7636 §4.1: 43-128 characters from the unreserved set. */
const MIN_VERIFIER_LENGTH = 43;
const MAX_VERIFIER_LENGTH = 128;

/**
 * base64url per RFC 4648 §5 — the standard alphabet with `+/` swapped for `-_`
 * and padding stripped. Plain base64 in a URL breaks: `+` decodes as a space.
 */
export function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  // crypto.getRandomValues, never Math.random: the verifier is the only thing
  // standing between a stolen code and a session.
  crypto.getRandomValues(bytes);
  return bytes;
}

/**
 * Generates a `code_verifier`.
 *
 * 32 random bytes encode to 43 base64url characters — the RFC's minimum, and
 * 256 bits of entropy.
 */
export function generateCodeVerifier(byteLength = 32): string {
  const verifier = base64UrlEncode(randomBytes(byteLength));
  if (
    verifier.length < MIN_VERIFIER_LENGTH ||
    verifier.length > MAX_VERIFIER_LENGTH
  ) {
    throw new Error(
      `code_verifier must be ${MIN_VERIFIER_LENGTH}-${MAX_VERIFIER_LENGTH} characters, got ${verifier.length}.`,
    );
  }
  return verifier;
}

/** `code_challenge = BASE64URL(SHA256(ASCII(code_verifier)))`. */
export async function computeCodeChallenge(verifier: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    // WebCrypto is unavailable on insecure origins, so this surfaces as a
    // confusing "cannot read subtle of undefined" without the explicit check.
    throw new Error(
      "WebCrypto is unavailable. PKCE requires a secure context (HTTPS or localhost).",
    );
  }
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  return base64UrlEncode(new Uint8Array(digest));
}

export interface PkcePair {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: "S256";
}

export async function createPkcePair(): Promise<PkcePair> {
  const codeVerifier = generateCodeVerifier();
  return {
    codeVerifier,
    codeChallenge: await computeCodeChallenge(codeVerifier),
    codeChallengeMethod: "S256",
  };
}

/**
 * An opaque, single-use `state` value.
 *
 * PKCE proves the code came back to the client that requested it; `state`
 * proves the *user* initiated the request. Both are needed — PKCE alone does
 * not stop login CSRF, where an attacker feeds you their authorization code to
 * silently log you into their account.
 */
export function generateState(): string {
  return base64UrlEncode(randomBytes(16));
}

/** A `nonce` for OIDC ID-token replay protection. */
export function generateNonce(): string {
  return base64UrlEncode(randomBytes(16));
}

/* -------------------------------------------------------------------------
 * Transaction storage
 * ---------------------------------------------------------------------- */

const STORAGE_PREFIX = "pkce.tx.";
/** An authorization redirect that takes longer than this is abandoned. */
const DEFAULT_TTL_MS = 10 * 60 * 1000;

export interface PkceTransaction {
  state: string;
  codeVerifier: string;
  nonce?: string;
  redirectUri: string;
  /** Where to send the user once the exchange completes. */
  returnTo?: string;
  provider: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * Where in-flight PKCE transactions live.
 *
 * sessionStorage, not localStorage: the verifier is a bearer secret for the
 * length of one redirect, and sessionStorage is scoped to the tab and cleared
 * when it closes. localStorage would leave verifiers on disk across sessions
 * and share them with every other tab on the origin.
 */
export interface TransactionStore {
  save(transaction: PkceTransaction): void;
  take(state: string): PkceTransaction | null;
  clearExpired(now?: number): void;
}

export function createTransactionStore(
  storage: Storage = sessionStorage,
): TransactionStore {
  return {
    save(transaction) {
      storage.setItem(
        STORAGE_PREFIX + transaction.state,
        JSON.stringify(transaction),
      );
    },

    /**
     * Reads and removes a transaction. Single-use by construction: a replayed
     * callback finds nothing and is rejected.
     */
    take(state) {
      const key = STORAGE_PREFIX + state;
      const raw = storage.getItem(key);
      if (!raw) return null;
      storage.removeItem(key);

      try {
        const transaction = JSON.parse(raw) as PkceTransaction;
        if (transaction.expiresAt < Date.now()) return null;
        return transaction;
      } catch {
        return null;
      }
    },

    /** Sweeps abandoned transactions so they don't accumulate in the tab. */
    clearExpired(now = Date.now()) {
      const stale: string[] = [];
      for (let index = 0; index < storage.length; index++) {
        const key = storage.key(index);
        if (!key?.startsWith(STORAGE_PREFIX)) continue;
        try {
          const transaction = JSON.parse(
            storage.getItem(key) ?? "{}",
          ) as PkceTransaction;
          if (!transaction.expiresAt || transaction.expiresAt < now) {
            stale.push(key);
          }
        } catch {
          stale.push(key);
        }
      }
      for (const key of stale) storage.removeItem(key);
    },
  };
}

export async function beginPkceTransaction(input: {
  provider: string;
  redirectUri: string;
  returnTo?: string;
  withNonce?: boolean;
  ttlMs?: number;
}): Promise<{ transaction: PkceTransaction; pair: PkcePair }> {
  const pair = await createPkcePair();
  const now = Date.now();

  const transaction: PkceTransaction = {
    state: generateState(),
    codeVerifier: pair.codeVerifier,
    nonce: input.withNonce ? generateNonce() : undefined,
    redirectUri: input.redirectUri,
    returnTo: input.returnTo,
    provider: input.provider,
    createdAt: now,
    expiresAt: now + (input.ttlMs ?? DEFAULT_TTL_MS),
  };

  return { transaction, pair };
}
