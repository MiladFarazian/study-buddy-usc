/**
 * Home-realm discovery and domain enforcement.
 *
 * The suffix matching here is security-relevant: getting it wrong either locks
 * out legitimate USC subdomains or hands a lookalike domain to USC's IdP.
 */

import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { signInWithSSO: vi.fn(), signInWithOAuth: vi.fn() } },
}));

const { emailDomain, isAllowedEmail, resolveSsoMethod } = await import("../sso");

describe("emailDomain", () => {
  it("extracts and lowercases the domain", () => {
    expect(emailDomain("Student@USC.EDU")).toBe("usc.edu");
    expect(emailDomain("  trojan@usc.edu  ")).toBe("usc.edu");
  });

  it("takes the last @ so quoted local parts don't confuse it", () => {
    expect(emailDomain("weird@name@usc.edu")).toBe("usc.edu");
  });

  it("rejects malformed input", () => {
    for (const input of ["", "no-at-sign", "@usc.edu", "user@", "user@localhost"]) {
      expect(emailDomain(input)).toBeNull();
    }
  });
});

describe("resolveSsoMethod", () => {
  it("routes usc.edu to SAML", () => {
    expect(resolveSsoMethod("student@usc.edu")).toEqual({
      method: "saml",
      domain: "usc.edu",
    });
  });

  it("routes USC subdomains to the parent IdP", () => {
    // Schools issue @marshall.usc.edu and friends; they federate with USC.
    expect(resolveSsoMethod("mba@marshall.usc.edu")).toEqual({
      method: "saml",
      domain: "usc.edu",
    });
  });

  it("does not match a lookalike domain", () => {
    // The check is anchored on a dot. A bare endsWith("usc.edu") would send
    // these to USC's identity provider.
    for (const email of [
      "attacker@notusc.edu",
      "attacker@evil-usc.edu",
      "attacker@usc.edu.attacker.com",
    ]) {
      expect(resolveSsoMethod(email).method).toBe("unsupported");
    }
  });

  it("treats unknown domains as unsupported", () => {
    expect(resolveSsoMethod("someone@gmail.com").method).toBe("unsupported");
  });

  it("is case-insensitive", () => {
    expect(resolveSsoMethod("Student@USC.edu").method).toBe("saml");
  });
});

describe("isAllowedEmail", () => {
  it("accepts USC addresses and subdomains", () => {
    expect(isAllowedEmail("student@usc.edu")).toBe(true);
    expect(isAllowedEmail("faculty@marshall.usc.edu")).toBe(true);
  });

  it("rejects everything else, including near-misses", () => {
    for (const email of [
      "someone@gmail.com",
      "attacker@notusc.edu",
      "attacker@usc.edu.evil.com",
      "",
      null,
      undefined,
    ]) {
      expect(isAllowedEmail(email)).toBe(false);
    }
  });
});
