import "server-only";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { RECEIPT_BUCKET } from "@/lib/receipt-validation";

export type PendingPayment = {
  id: string;
  guestName: string;
  payerName: string;
  giftTitle: string;
  giftType: "COTAS" | "LIVRE";
  amountCents: number;
  txid: string;
  createdAt: string;
  receiptUrl: string;
};

type PendingPaymentRow = {
  id: string;
  amount_cents: number;
  payer_name: string | null;
  txid: string | null;
  receipt_url: string | null;
  created_at: string;
  guests: { name: string } | { name: string }[] | null;
  gifts:
    | { title: string; type: "COTAS" | "LIVRE" }
    | { title: string; type: "COTAS" | "LIVRE" }[]
    | null;
};

function first<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function getPendingPayments(): Promise<PendingPayment[]> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("claims")
    .select(
      "id, amount_cents, payer_name, txid, receipt_url, created_at, guests(name), gifts(title, type)"
    )
    .eq("status", "EM_ANALISE")
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Fila de pagamentos: ${error.message}`);

  const rows = (data ?? []) as unknown as PendingPaymentRow[];
  const valid = rows.filter(
    (row) =>
      Number.isSafeInteger(row.amount_cents) &&
      row.amount_cents > 0 &&
      row.receipt_url &&
      first(row.guests) &&
      first(row.gifts)
  );

  return Promise.all(
    valid.map(async (row) => {
      const guest = first(row.guests)!;
      const gift = first(row.gifts)!;
      const { data: signed, error: signedError } = await admin.storage
        .from(RECEIPT_BUCKET)
        .createSignedUrl(row.receipt_url!, 600);
      if (signedError) {
        console.error("signed receipt:", signedError.message);
      }
      return {
        id: row.id,
        guestName: guest.name,
        payerName: row.payer_name || "Não informado",
        giftTitle: gift.title,
        giftType: gift.type,
        amountCents: row.amount_cents,
        txid: row.txid || "—",
        createdAt: row.created_at,
        receiptUrl: signed?.signedUrl ?? "",
      };
    })
  );
}
