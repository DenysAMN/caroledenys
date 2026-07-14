import "server-only";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { isPixPaymentData } from "@/lib/receipt-validation";

// Leitura de claim para a tela de pagamento. `claims` é privado (RLS) — só
// servidor com service_role. Expomos APENAS o necessário para pagar; nunca
// telefone nem dados do convidado.

export interface PaymentClaim {
  id: string;
  status: string;
  amount_cents: number;
  txid: string;
  expires_at: string | null;
  shares: number | null;
  gift_id: string;
  gift_title: string;
}

export async function getClaimForPayment(id: string): Promise<PaymentClaim | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("claims")
    .select("id, status, amount_cents, txid, expires_at, shares, gift_id, gifts(title)")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("getClaimForPayment:", error.message);
    return null;
  }

  const g = data.gifts as { title?: string } | { title?: string }[] | null;
  const gift_title = Array.isArray(g) ? g[0]?.title : g?.title;
  if (!isPixPaymentData(data.amount_cents, data.txid)) return null;

  return {
    id: data.id,
    status: data.status,
    amount_cents: data.amount_cents,
    txid: data.txid,
    expires_at: data.expires_at,
    shares: data.shares,
    gift_id: data.gift_id,
    gift_title: gift_title ?? "Presente",
  };
}
