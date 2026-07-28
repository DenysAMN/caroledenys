import { describe, expect, it } from "vitest";
import {
  extractClientIp,
  hashRateLimitKey,
} from "./rate-limit-rules";

describe("extractClientIp", () => {
  it("prioriza o header protegido da Vercel", () => {
    const headers = new Headers({
      "x-vercel-forwarded-for": "203.0.113.8",
      "x-forwarded-for": "198.51.100.4",
      "x-real-ip": "192.0.2.2",
    });

    expect(extractClientIp(headers)).toBe("203.0.113.8");
  });

  it("usa o primeiro IP válido da cadeia de fallback", () => {
    const headers = new Headers({
      "x-forwarded-for": "198.51.100.4, 10.0.0.2",
    });

    expect(extractClientIp(headers)).toBe("198.51.100.4");
  });

  it("aceita IPv6 e rejeita texto malformado", () => {
    expect(
      extractClientIp(new Headers({ "x-real-ip": "2001:db8::8a2e:370:7334" }))
    ).toBe("2001:db8::8a2e:370:7334");
    expect(
      extractClientIp(new Headers({ "x-forwarded-for": "não-é-ip" }))
    ).toBe("unknown");
  });
});

describe("hashRateLimitKey", () => {
  it("produz o vetor HMAC-SHA256 conhecido", () => {
    expect(
      hashRateLimitKey(
        "The quick brown fox jumps over the lazy dog",
        "key"
      )
    ).toBe("f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8");
  });

  it("é estável e não expõe o valor original", () => {
    const first = hashRateLimitKey("203.0.113.8", "segredo");
    const second = hashRateLimitKey("203.0.113.8", "segredo");
    const other = hashRateLimitKey("203.0.113.9", "segredo");

    expect(first).toBe(second);
    expect(first).not.toBe(other);
    expect(first).not.toContain("203.0.113.8");
    expect(first).toMatch(/^[0-9a-f]{64}$/);
  });
});
