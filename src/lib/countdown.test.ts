import { describe, expect, it } from "vitest";
import { getCountdownParts, WEDDING_AT } from "./countdown";

describe("getCountdownParts", () => {
  it("counts down to the ceremony at 15:30 in Rio das Ostras", () => {
    expect(getCountdownParts(new Date("2027-01-31T15:29:00-03:00").getTime())).toEqual({
      days: 0,
      hours: 0,
      minutes: 1,
      seconds: 0,
    });
  });

  it("decomposes the remaining time into calendar display units", () => {
    const remaining = (1 * 86_400 + 2 * 3_600 + 3 * 60 + 4) * 1_000;

    expect(getCountdownParts(WEDDING_AT - remaining)).toEqual({
      days: 1,
      hours: 2,
      minutes: 3,
      seconds: 4,
    });
  });

  it("returns zero in every unit at the ceremony time", () => {
    expect(getCountdownParts(WEDDING_AT)).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
  });

  it("never returns negative units after the ceremony", () => {
    expect(getCountdownParts(WEDDING_AT + 60_000)).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
  });
});
