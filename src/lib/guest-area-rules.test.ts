import { describe, expect, it } from "vitest";
import {
  claimStatusLabel,
  isUuid,
  shouldOfferPayment,
} from "./guest-area-rules";

describe("isUuid", () => {
  it("aceita UUID canônico e rejeita texto arbitrário", () => {
    expect(isUuid("08ee4652-8e80-4a3a-b9be-676b7f498d81")).toBe(true);
    expect(isUuid("../../claims")).toBe(false);
  });
});

describe("claimStatusLabel", () => {
  it("traduz todos os estados conhecidos", () => {
    expect(claimStatusLabel("PAGO")).toBe("Pagamento confirmado");
    expect(claimStatusLabel("RECEBIDO")).toBe("Presente recebido");
    expect(claimStatusLabel("EXPIRADO")).toBe("Reserva expirada");
  });

  it("usa descrição segura para estado desconhecido", () => {
    expect(claimStatusLabel("NOVO_ESTADO")).toBe("Em acompanhamento");
  });
});

describe("shouldOfferPayment", () => {
  it("oferece continuação somente enquanto aguarda pagamento", () => {
    expect(shouldOfferPayment("AGUARDANDO_PAGAMENTO")).toBe(true);
    expect(shouldOfferPayment("EM_ANALISE")).toBe(false);
    expect(shouldOfferPayment("PAGO")).toBe(false);
  });
});
