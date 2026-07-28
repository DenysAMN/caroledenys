import { isUuid } from "./guest-area-rules";
import { normalizeMessage, normalizePhone } from "./reservas";

export type RsvpStatus = "CONFIRMADO" | "NAO_VOU";

export type ParsedRsvp = {
  name: string;
  phone: string;
  rsvp: RsvpStatus;
  companions: number;
  notes: string | null;
  guestToken: string | null;
};

export type RsvpInput = {
  name: unknown;
  whatsapp: unknown;
  attendance: unknown;
  companions: unknown;
  notes?: unknown;
  guestToken?: unknown;
};

export type RsvpParseResult =
  | { ok: true; value: ParsedRsvp }
  | { ok: false; error: string };

export function parseRsvpInput(input: RsvpInput): RsvpParseResult {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const phone = normalizePhone(
    typeof input.whatsapp === "string" ? input.whatsapp : ""
  );
  const rsvp =
    input.attendance === "CONFIRMADO" || input.attendance === "NAO_VOU"
      ? input.attendance
      : null;
  const companionsRaw =
    typeof input.companions === "string" && input.companions.trim() !== ""
      ? Number(input.companions)
      : input.companions;
  const companions =
    typeof companionsRaw === "number" &&
    Number.isSafeInteger(companionsRaw) &&
    companionsRaw >= 0 &&
    companionsRaw <= 20
      ? companionsRaw
      : null;
  const guestToken =
    input.guestToken === null ||
    input.guestToken === undefined ||
    input.guestToken === ""
      ? null
      : isUuid(input.guestToken)
        ? input.guestToken.trim().toLowerCase()
        : undefined;

  if (name.length < 2 || name.length > 120) {
    return { ok: false, error: "Informe seu nome completo." };
  }
  if (!phone) {
    return { ok: false, error: "Informe um WhatsApp válido, com DDD." };
  }
  if (!rsvp) {
    return { ok: false, error: "Escolha se você vai ao casamento." };
  }
  if (companions === null) {
    return { ok: false, error: "Informe até 20 acompanhantes." };
  }
  if (guestToken === undefined) {
    return { ok: false, error: "Identificação do navegador inválida." };
  }

  return {
    ok: true,
    value: {
      name,
      phone,
      rsvp,
      companions: rsvp === "NAO_VOU" ? 0 : companions,
      notes: normalizeMessage(
        typeof input.notes === "string" ? input.notes : undefined
      ),
      guestToken,
    },
  };
}
