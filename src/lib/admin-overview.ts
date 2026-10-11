import "server-only";
import { requireAdmin } from "./admin-auth";
import { createAdminClient } from "./supabaseAdmin";
import { buildOverview, type OverviewClaim } from "./admin-overview-rules";
import type { Gift } from "./types";

import { readAllRows } from "./admin-pagination";

export async function getAdminOverview() {
  await requireAdmin();
  const admin = createAdminClient();
  const [gifts, claims] = await Promise.all([
    readAllRows<Gift>((from,to) => admin.from("gifts").select("*").order("id").range(from,to)),
    readAllRows<{ gift_id: string; status: string; amount_cents: number | null; shares: number | null; guests: { name: string } | { name: string }[] | null }>((from,to) => admin.from("claims").select("gift_id,status,amount_cents,shares,guests(name)").order("id").range(from,to)),
  ]);
  const records: OverviewClaim[] = claims.map(row => ({ ...row, name: (Array.isArray(row.guests) ? row.guests[0] : row.guests)?.name ?? "" }));
  gifts.sort((a,b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title,"pt-BR"));
  return buildOverview(gifts, records);
}
