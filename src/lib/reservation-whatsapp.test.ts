import { describe, expect, it } from "vitest";
import { reservationMessage, whatsappUrl } from "./reservation-whatsapp";
import { normalizePhone } from "./reservas";

describe("reservation WhatsApp links", () => {
  it("uses the normalized recipient number and encodes the message", () => {
    const url = new URL(whatsappUrl("+55 (22) 99999-9999", "João & Ana\nReserva")!);
    expect(url.pathname).toBe("/5522999999999");
    expect(url.searchParams.get("text")).toBe("João & Ana\nReserva");
  });
  it.each(["", "00000000000", "22123456789", "551199999999999", "(20) 99999-9999"])("rejects malformed number %s", phone => {
    expect(normalizePhone(phone)).toBeNull();
    expect(whatsappUrl(phone, "reserva")).toBeNull();
  });
  it("accepts DDD 55 without mistaking it for the country code", () => {
    expect(normalizePhone("55 99999-9999")).toBe("+5555999999999");
  });
  it("distinguishes a reservation from a confirmed payment, without access tokens", () => {
    const text = reservationMessage({ name: "Maria", giftTitle: "Geladeira", giftId: "gift", claimId: "claim", expiresAt: "2027-01-01T18:00:00Z" });
    expect(text).toContain("pagamento ainda não confirmado");
    expect(text).toContain("/pagamento/claim");
    expect(text).toContain("Prazo para pagar");
    expect(text).not.toContain("token");
    expect(text).toContain("mesmo navegador");
  });
  it("links a physical gift reservation to its store detail page", () => {
    const text = reservationMessage({ name: "Maria", giftTitle: "Toalhas", giftId: "gift" });
    expect(text).toContain("/presentes/gift");
    expect(text).toContain("comprado na loja");
    expect(text).not.toContain("PIX pendente");
  });
});
