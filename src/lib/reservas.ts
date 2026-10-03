import type { SupabaseClient } from "@supabase/supabase-js";

// Helpers compartilhados pelas Server Actions de reserva (LINK, COTAS, LIVRE).
// Só rodam no servidor (são importados por arquivos "use server").

// WhatsApp livre -> E.164 (+55...). Aceita "(22) 99999-9999", "22999999999" etc.
export function normalizePhone(raw: string): string | null {
  const digits = (raw || "").replace(/\D/g, "");
  const national = digits.startsWith("55") && digits.length >= 12
    ? digits.slice(2)
    : digits;
  const areaCodes = new Set([
    "11", "12", "13", "14", "15", "16", "17", "18", "19", "21", "22", "24",
    "27", "28", "31", "32", "33", "34", "35", "37", "38", "41", "42", "43",
    "44", "45", "46", "47", "48", "49", "51", "53", "54", "55", "61", "62",
    "63", "64", "65", "66", "67", "68", "69", "71", "73", "74", "75", "77",
    "79", "81", "82", "83", "84", "85", "86", "87", "88", "89", "91", "92",
    "93", "94", "95", "96", "97", "98", "99",
  ]);
  if (!areaCodes.has(national.slice(0, 2))) return null;
  if (!/^(?:\d{2}9\d{8}|\d{2}[2-5]\d{7})$/.test(national)) return null;
  return `+55${national}`;
}

export function normalizeMessage(raw?: string): string | null {
  const message = (raw ?? "").trim().slice(0, 500);
  return message || null;
}

export function normalizeShareCount(raw: number): number | null {
  if (!Number.isSafeInteger(raw) || raw < 1 || raw > 1_000) return null;
  return raw;
}

export function normalizeAmountCents(raw: number): number | null {
  if (!Number.isSafeInteger(raw) || raw < 1 || raw > 10_000_000) return null;
  return raw;
}

export function selectGuestToken(
  storedToken: string,
  presentedToken: string | null | undefined,
  isNewGuest: boolean
): string | null {
  if (isNewGuest || presentedToken === storedToken) return storedToken;
  return null;
}

// Acha o convidado pelo telefone (dedup) ou cria. Devolve id + token.
// A service_role ignora o RLS, então isto só funciona no servidor.
export async function acharOuCriarConvidado(
  admin: SupabaseClient,
  nome: string,
  phone: string,
  presentedToken?: string | null
): Promise<{ id: string; token: string | null } | null> {
  const { data: existing } = await admin
    .from("guests")
    .select("id, token")
    .eq("phone", phone)
    .maybeSingle();
  if (existing) {
    return {
      id: existing.id,
      token: selectGuestToken(existing.token, presentedToken, false),
    };
  }

  const { data: created, error } = await admin
    .from("guests")
    .insert({ name: nome, phone })
    .select("id, token")
    .single();

  if (error) {
    // corrida: dois cadastros do mesmo telefone ao mesmo tempo -> re-lê
    if (error.code === "23505") {
      const { data: again } = await admin
        .from("guests")
        .select("id, token")
        .eq("phone", phone)
        .single();
      return again
        ? {
            id: again.id,
            token: selectGuestToken(again.token, presentedToken, false),
          }
        : null;
    }
    console.error("guest insert:", error.message);
    return null;
  }
  return {
    id: created.id,
    token: selectGuestToken(created.token, presentedToken, true),
  };
}
