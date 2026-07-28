"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { consumeReservationRateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabaseAdmin";
import {
  acharOuCriarConvidado,
  normalizeMessage,
  normalizePhone,
} from "@/lib/reservas";

// Fluxo LINK: acha-ou-cria convidado + reserve_link (atômico). Só servidor.

export type ReserveResult =
  | { ok: true; token: string | null }
  | {
      ok: false;
      error:
        | "JA_RESERVADO"
        | "DADOS_INVALIDOS"
        | "MUITAS_TENTATIVAS"
        | "ERRO";
    };

export async function reservarLink(input: {
  giftId: string;
  nome: string;
  whatsapp: string;
  recado?: string;
  guestToken?: string | null;
}): Promise<ReserveResult> {
  const nome = (input.nome || "").trim();
  const phone = normalizePhone(input.whatsapp);
  if (nome.length < 2 || nome.length > 120 || !phone) {
    return { ok: false, error: "DADOS_INVALIDOS" };
  }
  if (!(await consumeReservationRateLimit(await headers()))) {
    return { ok: false, error: "MUITAS_TENTATIVAS" };
  }

  const admin = createAdminClient();
  const guest = await acharOuCriarConvidado(
    admin,
    nome,
    phone,
    input.guestToken
  );
  if (!guest) return { ok: false, error: "ERRO" };

  const { error } = await admin.rpc("reserve_link", {
    p_gift_id: input.giftId,
    p_guest_id: guest.id,
    p_message: normalizeMessage(input.recado),
  });

  if (error) {
    if (error.message.includes("JA_RESERVADO")) {
      return { ok: false, error: "JA_RESERVADO" };
    }
    console.error("reserve_link:", error.message);
    return { ok: false, error: "ERRO" };
  }

  revalidatePath(`/presentes/${input.giftId}`);
  revalidatePath("/presentes");
  revalidatePath("/");
  return { ok: true, token: guest.token };
}
