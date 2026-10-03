import "server-only";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabaseAdmin";

export async function adminManagementReady() {
  await requireAdmin();
  const { data, error } = await createAdminClient().rpc("admin_management_ready");
  if (error && error.code !== "PGRST202") throw new Error("Não foi possível verificar as opções administrativas.");
  return !error && data === true;
}
