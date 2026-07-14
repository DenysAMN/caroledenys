"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabaseAdmin";

// Server Action do fluxo LINK. Roda SÓ no servidor (service_role).
// Passos: acha-ou-cria o convidado (dedup pelo telefone) e chama a função
// atômica reserve_link. A atomicidade que importa (não reservar 2x o mesmo
// presente) é garantida por reserve_link, não por este código.

export type ReserveResult =
  | { ok: true; token: string }
  | { ok: false; error: "JA_RESERVADO" | "DADOS_INVALIDOS" | "ERRO" };

// WhatsApp livre -> E.164 (+55...). Aceita "(22) 99999-9999", "22999999999" etc.
function normalizePhone(raw: string): string | null {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 13) return null;
  const withCountry =
    digits.startsWith("55") && digits.length >= 12 ? digits : `55${digits}`;
  if (withCountry.length < 12 || withCountry.length > 13) return null;
  return `+${withCountry}`;
}

export async function reservarLink(input: {
  giftId: string;
  nome: string;
  whatsapp: string;
  recado?: string;
}): Promise<ReserveResult> {
  const nome = (input.nome || "").trim();
  const phone = normalizePhone(input.whatsapp);
  if (nome.length < 2 || !phone) return { ok: false, error: "DADOS_INVALIDOS" };

  const admin = createAdminClient();

  // 1. acha ou cria o convidado (chave de dedup: o telefone)
  let guestId: string | null = null;
  let token: string | null = null;

  const { data: existing } = await admin
    .from("guests")
    .select("id, token")
    .eq("phone", phone)
    .maybeSingle();

  if (existing) {
    guestId = existing.id;
    token = existing.token;
  } else {
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
        guestId = again?.id ?? null;
        token = again?.token ?? null;
      } else {
        console.error("guest insert:", error.message);
        return { ok: false, error: "ERRO" };
      }
    } else {
      guestId = created.id;
      token = created.token;
    }
  }

  if (!guestId || !token) return { ok: false, error: "ERRO" };

  // 2. reserva atômica do LINK (função do Postgres)
  const { error: rpcError } = await admin.rpc("reserve_link", {
    p_gift_id: input.giftId,
    p_guest_id: guestId,
    p_message: (input.recado || "").trim() || null,
  });

  if (rpcError) {
    if (rpcError.message.includes("JA_RESERVADO")) {
      return { ok: false, error: "JA_RESERVADO" };
    }
    console.error("reserve_link:", rpcError.message);
    return { ok: false, error: "ERRO" };
  }

  // atualiza as páginas que mostram o status do presente
  revalidatePath(`/presentes/${input.giftId}`);
  revalidatePath("/presentes");
  revalidatePath("/");

  return { ok: true, token };
}
