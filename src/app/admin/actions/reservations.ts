"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { managementError, parseReservationAction, type ReservationAction } from "@/lib/admin-management-rules";

export async function manageReservation(id: string, action: ReservationAction, reason: string) {
  const actor = await requireAdmin();
  const parsed = parseReservationAction(id, action, reason);
  if (!parsed) return { ok: false, message: "Informe uma reserva válida e um motivo de 3 a 300 caracteres." };
  const admin = createAdminClient();
  const { error } = await admin.rpc("admin_manage_reservation", {
    p_claim_id: parsed.id, p_action: parsed.action, p_reason: parsed.reason, p_actor: actor.id,
  });
  if (error) return { ok: false, message: managementError(error) };
  for (const path of ["/", "/presentes", "/admin", "/admin/reservas", "/admin/presentes", "/meus"]) revalidatePath(path);
  revalidatePath("/presentes/[id]", "page");
  revalidatePath("/admin/presentes/[id]", "page");
  revalidatePath("/pagamento/[claimId]", "page");
  return { ok: true, message: parsed.action === "CANCEL" ? "Reserva cancelada. O presente ou as cotas foram liberados; o histórico foi preservado." : parsed.action === "RECEIVE" ? "Recebimento registrado." : "Recebimento desfeito. A reserva permanece com o convidado." };
}
