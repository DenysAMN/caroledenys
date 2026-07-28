import "server-only";

import {
  extractClientIp,
  hashRateLimitKey,
} from "@/lib/rate-limit-rules";
import { createAdminClient } from "@/lib/supabaseAdmin";

const RESERVATION_LIMIT = 5;
const RESERVATION_WINDOW_SECONDS = 60;

function signingSecret(): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada");
  return secret;
}

export async function consumeReservationRateLimit(
  requestHeaders: Pick<Headers, "get">
): Promise<boolean> {
  const ip = extractClientIp(requestHeaders);
  const keyHash = hashRateLimitKey(ip, signingSecret());
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("consume_reservation_rate_limit", {
    p_key_hash: keyHash,
    p_limit: RESERVATION_LIMIT,
    p_window_seconds: RESERVATION_WINDOW_SECONDS,
  });

  if (error) {
    console.error("reservation rate limit:", error.message);
    return false;
  }

  return data === true;
}
