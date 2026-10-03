import "server-only";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabaseAdmin";
import type { Gift } from "@/lib/types";

export const GIFT_IMAGE_BUCKET = "gift-images";

export async function getAdminGifts(): Promise<(Gift & { reservedBy: string[] })[]> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("gifts")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(`Presentes: ${error.message}`);
  const { data: claims, error: claimsError } = await admin.from("claims")
    .select("gift_id, guests(name)")
    .in("status", ["RESERVADO", "AGUARDANDO_PAGAMENTO", "EM_ANALISE", "PAGO", "RECEBIDO"]);
  if (claimsError) throw new Error("Não foi possível carregar quem reservou os presentes.");
  const names = new Map<string, Set<string>>();
  for (const row of claims ?? []) {
    const guest = Array.isArray(row.guests) ? row.guests[0] : row.guests;
    if (!guest?.name) continue;
    const set = names.get(row.gift_id) ?? new Set<string>();
    set.add(guest.name); names.set(row.gift_id, set);
  }
  return ((data ?? []) as Gift[]).map(gift => ({ ...gift, reservedBy: [...(names.get(gift.id) ?? [])] }));
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
