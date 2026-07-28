import { afterEach, describe, expect, it } from "vitest";
import { isAllowedAdminEmail } from "./admin-policy";

const originalAdminEmail = process.env.ADMIN_EMAIL;

afterEach(() => {
  if (originalAdminEmail === undefined) delete process.env.ADMIN_EMAIL;
  else process.env.ADMIN_EMAIL = originalAdminEmail;
});

describe("isAllowedAdminEmail", () => {
  it("aceita o e-mail configurado ignorando caixa e espaços", () => {
    process.env.ADMIN_EMAIL = "  denys@example.com ";

    expect(isAllowedAdminEmail("DENYS@example.com")).toBe(true);
  });

  it("rejeita outro e-mail", () => {
    process.env.ADMIN_EMAIL = "denys@example.com";

    expect(isAllowedAdminEmail("outra@example.com")).toBe(false);
  });

  it("rejeita quando o ambiente ou o e-mail estão ausentes", () => {
    delete process.env.ADMIN_EMAIL;

    expect(isAllowedAdminEmail("denys@example.com")).toBe(false);
    expect(isAllowedAdminEmail(null)).toBe(false);
  });
});
