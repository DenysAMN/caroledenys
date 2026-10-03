"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { signClaimAccess } from "@/lib/claim-access";
import { consumeReservationRateLimit } from "@/lib/rate-limit";
import {
  acharOuCriarConvidado,
  normalizeAmountCents,
  normalizeMessage,
  normalizePhone,
} from "@/lib/reservas";

// Fluxo LIVRE: sem escassez, sem lock — só cria o claim direto.
// shares = null (não devolve cota na expiração); sem expires_at (não expira).

export type ReserveLivreResult =
  | {
      ok: true;
      claimId: string;
      guestToken: string | null;
      claimAccessToken: string;
      couplePhone: string | null;
    }
  | {
      ok: false;
      error:
        | "VALOR_INVALIDO"
        | "PRESENTE_INDISPONIVEL"
        | "DADOS_INVALIDOS"
        | "MUITAS_TENTATIVAS"
        | "ERRO";
    };

export async function reservarLivre(input: {
  giftId: string;
  amountCents: number;
  nome: string;
  whatsapp: string;
  recado?: string;
  guestToken?: string | null;
}): Promise<ReserveLivreResult> {
  const nome = (input.nome || "").trim();
  const phone = normalizePhone(input.whatsapp);
  const amount = normalizeAmountCents(input.amountCents);
  if (nome.length < 2 || nome.length > 120 || !phone) {
    return { ok: false, error: "DADOS_INVALIDOS" };
  }
  if (amount === null) return { ok: false, error: "VALOR_INVALIDO" };
  if (!(await consumeReservationRateLimit(await headers()))) {
    return { ok: false, error: "MUITAS_TENTATIVAS" };
  }

  const admin = createAdminClient();

  // valida o valor contra o mínimo do presente (fonte da verdade: o banco)
  const { data: gift } = await admin
    .from("gifts")
    .select("type, status, min_cents")
    .eq("id", input.giftId)
    .maybeSingle();
  if (!gift || gift.type !== "LIVRE" || gift.status !== "DISPONIVEL") {
    return { ok: false, error: "PRESENTE_INDISPONIVEL" };
  }
  if (amount < (gift.min_cents ?? 2000)) return { ok: false, error: "VALOR_INVALIDO" };

  const guest = await acharOuCriarConvidado(
    admin,
    nome,
    phone,
    input.guestToken
  );
  if (!guest) return { ok: false, error: "ERRO" };

  const txid = randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
  const { data: claim, error } = await admin
    .from("claims")
    .insert({
      gift_id: input.giftId,
      guest_id: guest.id,
      status: "AGUARDANDO_PAGAMENTO",
      amount_cents: amount,
      message: normalizeMessage(input.recado),
      txid,
    })
    .select("id")
    .single();

  if (error || !claim) {
    console.error("livre insert:", error?.message);
    return { ok: false, error: "ERRO" };
  }

  revalidatePath("/"); // LIVRE não altera o status do presente
  return {
    ok: true,
    claimId: claim.id,
    guestToken: guest.token,
    couplePhone: normalizePhone(process.env.RESERVATION_NOTIFY_PHONE ?? ""),
    claimAccessToken: signClaimAccess(claim.id, guest.id),
  };
}
