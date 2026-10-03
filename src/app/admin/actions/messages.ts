"use server";

import { managementError, parseMessageEdit } from "@/lib/admin-management-rules";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import {
  parseMessageModerationInput,
  type MessageSource,
  type ModerationDecision,
} from "@/lib/admin-message-rules";
import { createAdminClient } from "@/lib/supabaseAdmin";

export type MessageActionResult = { ok: boolean; message: string };

export async function moderateMessage(
  id: string,
  source: MessageSource,
  decision: ModerationDecision
): Promise<MessageActionResult> {
  await requireAdmin();
  const parsed = parseMessageModerationInput(id, source, decision);
  if (!parsed) return { ok: false, message: "Recado inválido." };

  const admin = createAdminClient();
  const { error } =
    parsed.source === "CLAIM"
      ? await admin
          .from("claims")
          .update({ message_approved: parsed.approved })
          .eq("id", parsed.id)
      : await admin
          .from("guests")
          .update({ notes_approved: parsed.approved })
          .eq("id", parsed.id);

  if (error) {
    console.error("moderate message:", error.message);
    return { ok: false, message: "Não foi possível alterar o recado." };
  }

  revalidatePath("/admin/recados");
  revalidatePath("/recados");
  revalidatePath("/");
  return {
    ok: true,
    message: parsed.approved ? "Recado publicado." : "Recado ocultado.",
  };
}

export async function editMessage(id: string, source: MessageSource, text: string, expectedText: string): Promise<MessageActionResult> {
  const actor = await requireAdmin();
  const parsed = parseMessageEdit(id, source, text, expectedText);
  if (!parsed) return { ok: false, message: "Informe um recado de 1 a 2.000 caracteres." };
  const { error } = await createAdminClient().rpc("admin_edit_message", {
    p_id: parsed.id, p_source: parsed.source, p_text: parsed.text,
    p_expected_text: parsed.expectedText, p_actor: actor.id,
  });
  if (error) return { ok: false, message: managementError(error) };
  revalidatePath("/admin/recados");
  revalidatePath("/recados");
  revalidatePath("/");
  return { ok: true, message: "Recado atualizado. A versão anterior ficou no histórico administrativo." };
}
