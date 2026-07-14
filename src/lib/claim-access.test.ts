import { afterEach, describe, expect, it, vi } from "vitest";
import { signClaimAccess, verifyClaimAccess } from "./claim-access";

vi.mock("server-only", () => ({}));

const originalSecret = process.env.SUPABASE_SERVICE_ROLE_KEY;

afterEach(() => {
  process.env.SUPABASE_SERVICE_ROLE_KEY = originalSecret;
});

describe("claim access capability", () => {
  it("authorizes only the exact claim and guest pair", () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "sb_secret_test_only_not_real";
    const token = signClaimAccess("claim-a", "guest-a");

    expect(verifyClaimAccess("claim-a", "guest-a", token)).toBe(true);
    expect(verifyClaimAccess("claim-b", "guest-a", token)).toBe(false);
    expect(verifyClaimAccess("claim-a", "guest-b", token)).toBe(false);
    expect(verifyClaimAccess("claim-a", "guest-a", "invalid")).toBe(false);
  });
});
