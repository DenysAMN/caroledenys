import "server-only";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { readAllRows } from "./admin-pagination";
import type { Gift } from "@/lib/types";

export const GIFT_IMAGE_BUCKET = "gift-images";

export async function getAdminGifts(): Promise<(Gift & { reservedBy: string[]; paidShares: number; hasReceived: boolean; hasReservations: boolean; hasPending: boolean })[]> {
  await requireAdmin();
  const admin = createAdminClient();
  const [data, claims] = await Promise.all([
    readAllRows<Gift>((from,to) => admin.from("gifts").select("*").order("sort_order").order("id").range(from,to)),
    readAllRows<{ gift_id: string; status: string; shares: number | null; guests: { name: string } | { name: string }[] | null }>((from,to) => admin.from("claims")
      .select("gift_id,status,shares,guests(name)").in("status", ["RESERVADO", "AGUARDANDO_PAGAMENTO", "EM_ANALISE", "PAGO", "RECEBIDO"]).order("id").range(from,to)),
  ]);
  const names = new Map<string, Set<string>>();
  for (const row of claims ?? []) {
    const guest = Array.isArray(row.guests) ? row.guests[0] : row.guests;
    if (!guest?.name) continue;
    const set = names.get(row.gift_id) ?? new Set<string>();
    set.add(guest.name); names.set(row.gift_id, set);
  }
  const stats = new Map<string, { paidShares: number; hasReceived: boolean; hasReservations: boolean; hasPending: boolean }>();
  for (const claim of claims) {
    const entry = stats.get(claim.gift_id) ?? { paidShares: 0, hasReceived: false, hasReservations: false, hasPending: false };
    entry.hasReservations = true;
    if (claim.status === "PAGO") entry.paidShares += claim.shares ?? 0;
    if (["PAGO", "RECEBIDO"].includes(claim.status)) entry.hasReceived = true;
    if (["RESERVADO", "AGUARDANDO_PAGAMENTO", "EM_ANALISE"].includes(claim.status)) entry.hasPending = true;
    stats.set(claim.gift_id, entry);
  }
  return data.map(gift => ({ ...gift, reservedBy: [...(names.get(gift.id) ?? [])],
    ...(stats.get(gift.id) ?? { paidShares: 0, hasReceived: false, hasReservations: false, hasPending: false }) }));
}

export async function getAdminGift(id: string): Promise<Gift | null> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("gifts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Presente: ${error.message}`);
  return (data as Gift | null) ?? null;
}

export async function getGiftReservations(giftId: string) {
  await requireAdmin();
  const { data, error } = await createAdminClient()
    .from("claims")
    .select("id, status, shares, amount_cents, created_at, guests(name, phone)")
    .eq("gift_id", giftId)
    .order("created_at", { ascending: false });
  if (error) throw new Error("Não foi possível carregar as reservas deste presente.");
  return (data ?? []).map((row) => {
    const guest = Array.isArray(row.guests) ? row.guests[0] : row.guests;
    return { id: row.id as string, status: row.status as string,
      shares: row.shares as number | null, amountCents: row.amount_cents as number | null,
      name: guest?.name ?? "Nome não informado", phone: guest?.phone ?? null };
  });
}
