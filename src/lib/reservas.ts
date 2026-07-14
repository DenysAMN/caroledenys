import type { SupabaseClient } from "@supabase/supabase-js";

// Helpers compartilhados pelas Server Actions de reserva (LINK, COTAS, LIVRE).
// Só rodam no servidor (são importados por arquivos "use server").

// WhatsApp livre -> E.164 (+55...). Aceita "(22) 99999-9999", "22999999999" etc.
export function normalizePhone(raw: string): string | null {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 13) return null;
  const withCountry =
    digits.startsWith("55") && digits.length >= 12 ? digits : `55${digits}`;
  if (withCountry.length < 12 || withCountry.length > 13) return null;
  return `+${withCountry}`;
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
