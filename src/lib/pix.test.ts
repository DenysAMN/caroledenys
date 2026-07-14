import { afterEach, describe, expect, it, vi } from "vitest";
import { hasError, isStaticPix, parsePix } from "pix-utils";
import { gerarPixBRCode } from "./pix";

vi.mock("server-only", () => ({}));

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("gerarPixBRCode", () => {
  it("generates a parseable PIX with fixed value, key and txid", () => {
    process.env.PIX_KEY = "teste@example.com";
    process.env.PIX_MERCHANT_NAME = "DENYS AUGUSTO";
    process.env.PIX_MERCHANT_CITY = "RIO DAS OSTRAS";

    const code = gerarPixBRCode({ amountCents: 100, txid: "TESTE12345" });
    const parsed = parsePix(code);

    expect(hasError(parsed)).toBe(false);
    if (hasError(parsed)) return;
    expect(isStaticPix(parsed)).toBe(true);
    if (!isStaticPix(parsed)) return;
    expect(parsed.transactionAmount).toBe(1);
    expect(parsed.pixKey).toBe("teste@example.com");
    expect(parsed.txid).toBe("TESTE12345");
  });
});
