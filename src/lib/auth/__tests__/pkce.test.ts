/**
 * PKCE conformance tests (RFC 7636).
 *
 * The verifier/challenge relationship is checked against the worked example in
 * RFC 7636 Appendix B, so a refactor that quietly changes the encoding — plain
 * base64, padded output, hex — fails here rather than at the token endpoint.
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  base64UrlEncode,
  beginPkceTransaction,
  computeCodeChallenge,
  createPkcePair,
  createTransactionStore,
  generateCodeVerifier,
  generateState,
} from "../pkce";

describe("base64UrlEncode", () => {
  it("uses the URL-safe alphabet and strips padding", () => {
    // 0xFB 0xFF exercises both characters that differ from standard base64.
    const encoded = base64UrlEncode(new Uint8Array([0xfb, 0xff, 0xfe]));
    expect(encoded).not.toContain("+");
    expect(encoded).not.toContain("/");
    expect(encoded).not.toContain("=");
  });

  it("round-trips through atob", () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 251, 252, 253, 254, 255]);
    const encoded = base64UrlEncode(bytes);
    const restored = atob(
      encoded.replace(/-/g, "+").replace(/_/g, "/").padEnd(
        Math.ceil(encoded.length / 4) * 4,
        "=",
      ),
    );
    expect([...restored].map((c) => c.charCodeAt(0))).toEqual([...bytes]);
  });
});

describe("generateCodeVerifier", () => {
  it("produces a verifier within the length RFC 7636 §4.1 allows", () => {
    const verifier = generateCodeVerifier();
    expect(verifier.length).toBeGreaterThanOrEqual(43);
    expect(verifier.length).toBeLessThanOrEqual(128);
  });

  it("only uses unreserved characters", () => {
    for (let i = 0; i < 50; i++) {
      expect(generateCodeVerifier()).toMatch(/^[A-Za-z0-9\-._~]+$/);
    }
  });

  it("is unpredictable across calls", () => {
    const verifiers = new Set(
      Array.from({ length: 200 }, () => generateCodeVerifier()),
    );
    // A collision here means the generator is not actually random, which would
    // make the whole exchange forgeable.
    expect(verifiers.size).toBe(200);
  });
});

describe("computeCodeChallenge", () => {
  it("matches the worked example in RFC 7636 Appendix B", async () => {
    const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    const expected = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";
    expect(await computeCodeChallenge(verifier)).toBe(expected);
  });

  it("is deterministic for a given verifier", async () => {
    const verifier = generateCodeVerifier();
    expect(await computeCodeChallenge(verifier)).toBe(
      await computeCodeChallenge(verifier),
    );
  });

  it("differs for different verifiers", async () => {
    const [a, b] = [generateCodeVerifier(), generateCodeVerifier()];
    expect(await computeCodeChallenge(a)).not.toBe(await computeCodeChallenge(b));
  });

  it("never returns the verifier itself", async () => {
    // The `plain` method is a downgrade attack; only S256 is implemented.
    const verifier = generateCodeVerifier();
    expect(await computeCodeChallenge(verifier)).not.toBe(verifier);
  });
});

describe("createPkcePair", () => {
  it("declares S256 and a matching challenge", async () => {
    const pair = await createPkcePair();
    expect(pair.codeChallengeMethod).toBe("S256");
    expect(pair.codeChallenge).toBe(
      await computeCodeChallenge(pair.codeVerifier),
    );
  });
});

describe("generateState", () => {
  it("produces distinct opaque values", () => {
    const values = new Set(Array.from({ length: 200 }, () => generateState()));
    expect(values.size).toBe(200);
  });
});

describe("transaction store", () => {
  beforeEach(() => sessionStorage.clear());

  it("round-trips a transaction by state", async () => {
    const store = createTransactionStore(sessionStorage);
    const { transaction } = await beginPkceTransaction({
      provider: "google",
      redirectUri: "https://app.test/auth/callback",
    });

    store.save(transaction);
    expect(store.take(transaction.state)?.codeVerifier).toBe(
      transaction.codeVerifier,
    );
  });

  it("is single-use: a replayed state finds nothing", async () => {
    const store = createTransactionStore(sessionStorage);
    const { transaction } = await beginPkceTransaction({
      provider: "google",
      redirectUri: "https://app.test/auth/callback",
    });

    store.save(transaction);
    expect(store.take(transaction.state)).not.toBeNull();
    // A second callback with the same state is a replay, and must fail.
    expect(store.take(transaction.state)).toBeNull();
  });

  it("rejects an unknown state", () => {
    const store = createTransactionStore(sessionStorage);
    expect(store.take("state-we-never-issued")).toBeNull();
  });

  it("rejects an expired transaction", async () => {
    const store = createTransactionStore(sessionStorage);
    const { transaction } = await beginPkceTransaction({
      provider: "google",
      redirectUri: "https://app.test/auth/callback",
      ttlMs: -1,
    });

    store.save(transaction);
    expect(store.take(transaction.state)).toBeNull();
  });

  it("sweeps expired transactions without touching live ones", async () => {
    const store = createTransactionStore(sessionStorage);

    const stale = await beginPkceTransaction({
      provider: "google",
      redirectUri: "https://app.test/auth/callback",
      ttlMs: -1,
    });
    const live = await beginPkceTransaction({
      provider: "google",
      redirectUri: "https://app.test/auth/callback",
    });

    store.save(stale.transaction);
    store.save(live.transaction);
    store.clearExpired();

    expect(store.take(stale.transaction.state)).toBeNull();
    expect(store.take(live.transaction.state)).not.toBeNull();
  });

  it("survives corrupted storage without throwing", () => {
    const store = createTransactionStore(sessionStorage);
    sessionStorage.setItem("pkce.tx.broken", "{not json");
    expect(store.take("broken")).toBeNull();
    expect(() => store.clearExpired()).not.toThrow();
  });

  it("includes a nonce only when asked", async () => {
    const withNonce = await beginPkceTransaction({
      provider: "usc-saml",
      redirectUri: "https://app.test/auth/callback",
      withNonce: true,
    });
    const without = await beginPkceTransaction({
      provider: "google",
      redirectUri: "https://app.test/auth/callback",
    });

    expect(withNonce.transaction.nonce).toBeTruthy();
    expect(without.transaction.nonce).toBeUndefined();
  });
});
