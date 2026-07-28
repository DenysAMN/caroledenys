"use server";

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
  return {
    ok: true,
    message: parsed.approved ? "Recado publicado." : "Recado ocultado.",
  };
}
