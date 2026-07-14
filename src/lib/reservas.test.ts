import { describe, expect, it } from "vitest";
import {
  normalizeAmountCents,
  normalizeMessage,
  normalizePhone,
  normalizeShareCount,
  selectGuestToken,
} from "./reservas";

describe("normalizePhone", () => {
  it.each([
    ["(22) 99999-9999", "+5522999999999"],
    ["22 99999 9999", "+5522999999999"],
    ["+55 (22) 99999-9999", "+5522999999999"],
  ])("normalizes Brazilian WhatsApp numbers", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each(["", "123", "22999999999999"])("rejects invalid phone numbers", (input) => {
    expect(normalizePhone(input)).toBeNull();
  });
});

describe("normalizeMessage", () => {
  it("trims an optional guest message", () => {
    expect(normalizeMessage("  Felicidades!  ")).toBe("Felicidades!");
  });

  it("turns blank messages into null and limits abuse", () => {
    expect(normalizeMessage("   ")).toBeNull();
    expect(normalizeMessage("a".repeat(600))).toHaveLength(500);
  });
});

describe("numeric reservation inputs", () => {
  it.each([1, 2, 24])("accepts positive integer share counts", (value) => {
    expect(normalizeShareCount(value)).toBe(value);
  });

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects invalid share counts",
    (value) => {
      expect(normalizeShareCount(value)).toBeNull();
    }
  );

  it("accepts integer cents and rejects unsafe free amounts", () => {
    expect(normalizeAmountCents(2_000)).toBe(2_000);
    expect(normalizeAmountCents(10_000_000)).toBe(10_000_000);
    expect(normalizeAmountCents(1.5)).toBeNull();
    expect(normalizeAmountCents(Number.NaN)).toBeNull();
    expect(normalizeAmountCents(10_000_001)).toBeNull();
  });
});

describe("selectGuestToken", () => {
  it("returns the token for a newly created guest", () => {
    expect(selectGuestToken("stored-token", null, true)).toBe("stored-token");
  });

  it("returns an existing token only when the browser already presents it", () => {
    expect(selectGuestToken("stored-token", "stored-token", false)).toBe("stored-token");
    expect(selectGuestToken("stored-token", null, false)).toBeNull();
    expect(selectGuestToken("stored-token", "wrong-token", false)).toBeNull();
  });
});
