import { describe, expect, it } from "vitest";
import {
  buildReceiptPath,
  isReceiptPathForClaim,
  isClaimPayable,
  isAcceptedReceipt,
  isPixPaymentData,
  validateReceiptMetadata,
} from "./receipt-validation";

describe("validateReceiptMetadata", () => {
  it("accepts a private receipt image with payer name", () => {
    expect(
      validateReceiptMetadata({
        payerName: "Maria Silva",
        mimeType: "image/jpeg",
        size: 1_250_000,
      })
    ).toEqual({ ok: true, extension: "jpg", payerName: "Maria Silva" });
  });

  it("accepts PDF and normalizes whitespace in payer name", () => {
    expect(
      validateReceiptMetadata({
        payerName: "  João   da Silva  ",
        mimeType: "application/pdf",
        size: 80_000,
      })
    ).toEqual({ ok: true, extension: "pdf", payerName: "João da Silva" });
  });

  it.each([
    [{ payerName: "A", mimeType: "image/png", size: 10 }, "PAYER_NAME_INVALID"],
    [{ payerName: "Maria", mimeType: "image/gif", size: 10 }, "FILE_TYPE_INVALID"],
    [{ payerName: "Maria", mimeType: "image/png", size: 0 }, "FILE_EMPTY"],
    [{ payerName: "Maria", mimeType: "image/png", size: 5_000_001 }, "FILE_TOO_LARGE"],
  ])("rejects invalid metadata", (input, error) => {
    expect(validateReceiptMetadata(input)).toEqual({ ok: false, error });
  });
});

describe("isClaimPayable", () => {
  const now = new Date("2026-07-14T18:00:00.000Z");

  it("accepts an active COTAS claim", () => {
    expect(
      isClaimPayable("AGUARDANDO_PAGAMENTO", "2026-07-14T18:30:00.000Z", now)
    ).toBe(true);
  });

  it("rejects an expired COTAS claim", () => {
    expect(
      isClaimPayable("AGUARDANDO_PAGAMENTO", "2026-07-14T17:59:59.000Z", now)
    ).toBe(false);
  });

  it("accepts LIVRE without expiry and rejects other statuses", () => {
    expect(isClaimPayable("AGUARDANDO_PAGAMENTO", null, now)).toBe(true);
    expect(isClaimPayable("EM_ANALISE", null, now)).toBe(false);
  });
});

describe("isPixPaymentData", () => {
  it("accepts a positive integer amount and short alphanumeric txid", () => {
    expect(isPixPaymentData(100, "ABC123DEF456")).toBe(true);
  });

  it.each([
    [null, "ABC123"],
    [0, "ABC123"],
    [100.5, "ABC123"],
    [100, null],
    [100, "txid com espaço"],
  ])("rejects malformed PIX claim data", (amount, txid) => {
    expect(isPixPaymentData(amount, txid)).toBe(false);
  });
});

describe("buildReceiptPath", () => {
  it("scopes the object path to the claim id", () => {
    expect(buildReceiptPath("claim-123")).toBe("claim-123/comprovante");
  });

  it("accepts only files inside the matching claim folder", () => {
    expect(isReceiptPathForClaim("claim-123/comprovante", "claim-123")).toBe(true);
    expect(isReceiptPathForClaim("claim-999/comprovante", "claim-123")).toBe(false);
    expect(isReceiptPathForClaim("claim-123/../claim-999/file.png", "claim-123")).toBe(false);
  });
});

describe("isAcceptedReceipt", () => {
  it("keeps the object already accepted by a concurrent finalization", () => {
    expect(
      isAcceptedReceipt("EM_ANALISE", "claim/comprovante", "claim/comprovante")
    ).toBe(true);
    expect(isAcceptedReceipt("PAGO", "claim/comprovante", "claim/comprovante")).toBe(
      true
    );
  });

  it("does not keep a different or unaccepted object", () => {
    expect(
      isAcceptedReceipt("EM_ANALISE", "claim/outro", "claim/comprovante")
    ).toBe(false);
    expect(
      isAcceptedReceipt("AGUARDANDO_PAGAMENTO", "claim/comprovante", "claim/comprovante")
    ).toBe(false);
  });
});
