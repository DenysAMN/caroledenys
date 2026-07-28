import "server-only";
import { requireAdmin } from "@/lib/admin-auth";
import { sumPaidCents } from "@/lib/admin-dashboard-rules";
import { createAdminClient } from "@/lib/supabaseAdmin";

export type AdminDashboardMetrics = {
  paidCents: number;
  pendingCount: number;
  completedGifts: number;
};

export async function getAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  await requireAdmin();
  const admin = createAdminClient();

  const [paid, pending, completed] = await Promise.all([
    admin.from("claims").select("amount_cents").eq("status", "PAGO"),
    admin
      .from("claims")
      .select("id", { count: "exact", head: true })
      .eq("status", "EM_ANALISE"),
    admin
      .from("gifts")
      .select("id", { count: "exact", head: true })
      .eq("status", "CONCLUIDO"),
  ]);

  if (paid.error || pending.error || completed.error) {
    throw new Error(
      paid.error?.message || pending.error?.message || completed.error?.message
    );
  }

  return {
    paidCents: sumPaidCents((paid.data ?? []).map((row) => row.amount_cents)),
    pendingCount: pending.count ?? 0,
    completedGifts: completed.count ?? 0,
  };
}
