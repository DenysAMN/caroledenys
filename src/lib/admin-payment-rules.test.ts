import { describe, expect, it } from "vitest";
import {
  parseAdminClaimId,
  paymentActionError,
} from "./admin-payment-rules";

describe("parseAdminClaimId", () => {
  it("aceita UUID e normaliza caixa", () => {
    expect(
      parseAdminClaimId("8335F22D-D402-48A8-94F1-1CFF9E989A68")
    ).toBe("8335f22d-d402-48a8-94f1-1cff9e989a68");
  });

  it("rejeita identificador arbitrário", () => {
    expect(parseAdminClaimId("claim-1")).toBeNull();
  });
});

describe("paymentActionError", () => {
  it("traduz conflito de estado sem expor erro do banco", () => {
    expect(paymentActionError("STATUS_INVALIDO")).toBe(
      "Esta contribuição já foi processada."
    );
  });

  it("usa mensagem genérica para falha desconhecida", () => {
    expect(paymentActionError("connection refused")).toBe(
      "Não foi possível concluir a ação. Tente novamente."
    );
  });
});
