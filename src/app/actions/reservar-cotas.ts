"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { signClaimAccess } from "@/lib/claim-access";
import {
  acharOuCriarConvidado,
  normalizeMessage,
  normalizePhone,
  normalizeShareCount,
} from "@/lib/reservas";

// Fluxo COTAS: acha-ou-cria convidado + reserve_shares (lock de linha, atômico).
// Cria um claim AGUARDANDO_PAGAMENTO com expires_at +60min. Só servidor.

export type ReserveCotasResult =
  | {
      ok: true;
      claimId: string;
      guestToken: string | null;
      claimAccessToken: string;
    }
  | {
      ok: false;
      error:
        | "COTAS_INSUFICIENTES"
        | "PRESENTE_INDISPONIVEL"
        | "DADOS_INVALIDOS"
        | "ERRO";
    };

export async function reservarCotas(input: {
  giftId: string;
  shares: number;
  nome: string;
  whatsapp: string;
  recado?: string;
  guestToken?: string | null;
}): Promise<ReserveCotasResult> {
  const nome = (input.nome || "").trim();
  const phone = normalizePhone(input.whatsapp);
  const shares = normalizeShareCount(input.shares);
  if (nome.length < 2 || nome.length > 120 || !phone || shares === null) {
    return { ok: false, error: "DADOS_INVALIDOS" };
  }

  const admin = createAdminClient();
  const { data: gift } = await admin
    .from("gifts")
    .select("type, status")
    .eq("id", input.giftId)
    .maybeSingle();
  if (!gift || gift.type !== "COTAS" || gift.status !== "DISPONIVEL") {
    return { ok: false, error: "PRESENTE_INDISPONIVEL" };
  }

  const guest = await acharOuCriarConvidado(
    admin,
    nome,
    phone,
    input.guestToken
  );
  if (!guest) return { ok: false, error: "ERRO" };

  const { data, error } = await admin.rpc("reserve_shares", {
    p_gift_id: input.giftId,
    p_guest_id: guest.id,
    p_shares: shares,
  });

  if (error) {
    if (error.message.includes("PRESENTE_INDISPONIVEL")) {
      return { ok: false, error: "PRESENTE_INDISPONIVEL" };
    }
    if (error.message.includes("COTAS_INSUFICIENTES")) {
      return { ok: false, error: "COTAS_INSUFICIENTES" };
    }
    console.error("reserve_shares:", error.message);
    return { ok: false, error: "ERRO" };
  }

  const claimId = (data as { id?: string } | null)?.id;
  if (!claimId) return { ok: false, error: "ERRO" };

  const message = normalizeMessage(input.recado);
  if (message) {
    const { error: messageError } = await admin
      .from("claims")
      .update({ message })
      .eq("id", claimId);
    if (messageError) console.error("cotas message:", messageError.message);
  }

  revalidatePath(`/presentes/${input.giftId}`);
  revalidatePath("/presentes");
  revalidatePath("/");
  return {
    ok: true,
    claimId,
    guestToken: guest.token,
    claimAccessToken: signClaimAccess(claimId, guest.id),
  };
}
