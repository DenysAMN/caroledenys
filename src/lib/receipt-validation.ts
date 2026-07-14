export const RECEIPT_BUCKET = "receipts";
export const MAX_RECEIPT_BYTES = 5_000_000;

const MIME_EXTENSIONS: Record<string, "jpg" | "png" | "webp" | "pdf"> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

type ReceiptMetadata = {
  payerName: string;
  mimeType: string;
  size: number;
};

export type ReceiptValidationResult =
  | { ok: true; extension: "jpg" | "png" | "webp" | "pdf"; payerName: string }
  | {
      ok: false;
      error:
        | "PAYER_NAME_INVALID"
        | "FILE_TYPE_INVALID"
        | "FILE_EMPTY"
        | "FILE_TOO_LARGE";
    };

export function validateReceiptMetadata(
  input: ReceiptMetadata
): ReceiptValidationResult {
  const payerName = input.payerName.trim().replace(/\s+/g, " ");
  if (payerName.length < 2 || payerName.length > 120) {
    return { ok: false, error: "PAYER_NAME_INVALID" };
  }

  const extension = MIME_EXTENSIONS[input.mimeType];
  if (!extension) return { ok: false, error: "FILE_TYPE_INVALID" };
  if (!Number.isInteger(input.size) || input.size < 1) {
    return { ok: false, error: "FILE_EMPTY" };
  }
  if (input.size > MAX_RECEIPT_BYTES) {
    return { ok: false, error: "FILE_TOO_LARGE" };
  }

  return { ok: true, extension, payerName };
}

export function isClaimPayable(
  status: string,
  expiresAt: string | null,
  now = new Date()
): boolean {
  if (status !== "AGUARDANDO_PAGAMENTO") return false;
  if (!expiresAt) return true;
  const expires = new Date(expiresAt).getTime();
  return Number.isFinite(expires) && expires > now.getTime();
}

export function isPixPaymentData(
  amountCents: unknown,
  txid: unknown
): amountCents is number {
  return (
    Number.isSafeInteger(amountCents) &&
    (amountCents as number) > 0 &&
    typeof txid === "string" &&
    /^[A-Z0-9]{1,25}$/.test(txid)
  );
}

export function buildReceiptPath(claimId: string): string {
  return `${claimId}/comprovante`;
}

export function isReceiptPathForClaim(path: string, claimId: string): boolean {
  return path === buildReceiptPath(claimId);
}

export function isAcceptedReceipt(
  status: string,
  storedPath: string | null,
  attemptedPath: string
): boolean {
  return (
    (status === "EM_ANALISE" || status === "PAGO") &&
    storedPath === attemptedPath
  );
}
