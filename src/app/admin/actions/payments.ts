"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import {
  parseAdminClaimId,
  paymentActionError,
} from "@/lib/admin-payment-rules";
import { RECEIPT_BUCKET } from "@/lib/receipt-validation";
import { createAdminClient } from "@/lib/supabaseAdmin";

export type AdminPaymentActionResult = {
  ok: boolean;
  message: string;
};

export async function confirmarPagamento(
  claimId: string
): Promise<AdminPaymentActionResult> {
  await requireAdmin();
  const id = parseAdminClaimId(claimId);
  if (!id) return { ok: false, message: "Contribuição inválida." };

  const admin = createAdminClient();
  const { error } = await admin.rpc("confirm_payment", { p_claim_id: id });
  if (error) return { ok: false, message: paymentActionError(error.message) };

  revalidatePath("/admin");
  return { ok: true, message: "Pagamento confirmado." };
}

export async function rejeitarPagamento(
  claimId: string
): Promise<AdminPaymentActionResult> {
  await requireAdmin();
  const id = parseAdminClaimId(claimId);
  if (!id) return { ok: false, message: "Contribuição inválida." };

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("reject_payment", {
    p_claim_id: id,
  });
  if (error) return { ok: false, message: paymentActionError(error.message) };

  const receiptPath = (data as { receipt_path?: string }[] | null)?.[0]
    ?.receipt_path;
  if (receiptPath) {
    const { error: storageError } = await admin.storage
      .from(RECEIPT_BUCKET)
      .remove([receiptPath]);
    if (storageError) console.error("delete rejected receipt:", storageError.message);
  }

  revalidatePath("/admin");
  revalidatePath("/presentes");
  return { ok: true, message: "Contribuição cancelada." };
}
