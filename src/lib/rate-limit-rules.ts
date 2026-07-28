import { createHmac } from "node:crypto";
import { isIP } from "node:net";

type HeaderReader = Pick<Headers, "get">;

const IP_HEADERS = [
  "x-vercel-forwarded-for",
  "x-forwarded-for",
  "x-real-ip",
] as const;

export function extractClientIp(headers: HeaderReader): string {
  for (const header of IP_HEADERS) {
    const value = headers.get(header);
    if (!value) continue;

    const candidate = value.split(",")[0]?.trim();
    if (candidate && isIP(candidate) !== 0) return candidate;
  }

  return "unknown";
}

export function hashRateLimitKey(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}
