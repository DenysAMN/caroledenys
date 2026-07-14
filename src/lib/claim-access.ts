import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

function signingSecret(): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada");
  return secret;
}

function payload(claimId: string, guestId: string): string {
  return `${claimId}:${guestId}`;
}

export function signClaimAccess(claimId: string, guestId: string): string {
  return createHmac("sha256", signingSecret())
    .update(payload(claimId, guestId))
    .digest("base64url");
}

export function verifyClaimAccess(
  claimId: string,
  guestId: string,
  token: string
): boolean {
  const expected = signClaimAccess(claimId, guestId);
  const expectedBytes = Buffer.from(expected);
  const tokenBytes = Buffer.from(token);
  return (
    expectedBytes.length === tokenBytes.length &&
    timingSafeEqual(expectedBytes, tokenBytes)
  );
}
