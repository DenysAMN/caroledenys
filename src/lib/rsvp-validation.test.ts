import { describe, expect, it } from "vitest";
import { parseRsvpInput } from "./rsvp-validation";

const valid = {
  name: "  Maria da Silva  ",
  whatsapp: "(22) 99999-9999",
  attendance: "CONFIRMADO",
  companions: "2",
  notes: "  Sem lactose  ",
  guestToken: "08ee4652-8e80-4a3a-b9be-676b7f498d81",
};

describe("parseRsvpInput", () => {
  it("normaliza confirmação, telefone, acompanhantes e observação", () => {
    expect(parseRsvpInput(valid)).toEqual({
      ok: true,
      value: {
        name: "Maria da Silva",
        phone: "+5522999999999",
        rsvp: "CONFIRMADO",
        companions: 2,
        notes: "Sem lactose",
        guestToken: valid.guestToken,
      },
    });
  });

  it("zera acompanhantes quando a pessoa não vai", () => {
    const result = parseRsvpInput({
      ...valid,
      attendance: "NAO_VOU",
      companions: "8",
    });
    expect(result.ok && result.value.companions).toBe(0);
  });

  it("rejeita status, telefone, quantidade e token inválidos", () => {
    expect(parseRsvpInput({ ...valid, attendance: "TALVEZ" }).ok).toBe(false);
    expect(parseRsvpInput({ ...valid, whatsapp: "123" }).ok).toBe(false);
    expect(parseRsvpInput({ ...valid, companions: "2.5" }).ok).toBe(false);
    expect(parseRsvpInput({ ...valid, guestToken: "não-é-uuid" }).ok).toBe(false);
  });

  it("limita nome e observação", () => {
    expect(parseRsvpInput({ ...valid, name: "A" }).ok).toBe(false);
    const result = parseRsvpInput({ ...valid, notes: "x".repeat(700) });
    expect(result.ok && result.value.notes?.length).toBe(500);
  });
});
