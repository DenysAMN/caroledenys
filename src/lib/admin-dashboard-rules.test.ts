import { describe, expect, it } from "vitest";
import { sumPaidCents } from "./admin-dashboard-rules";

describe("sumPaidCents", () => {
  it("soma somente inteiros positivos em centavos", () => {
    expect(sumPaidCents([100, 2500, null, -10, 12.5])).toBe(2600);
  });
});
