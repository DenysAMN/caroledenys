"use server";

import { revalidatePath } from "next/cache";
import {
  parseRsvpInput,
  type RsvpInput,
} from "@/lib/rsvp-validation";
import { createAdminClient } from "@/lib/supabaseAdmin";

export type RsvpActionResult =
  | { ok: true; guestToken: string; attendance: "CONFIRMADO" | "NAO_VOU" }
  | {
      ok: false;
      error: "DADOS_INVALIDOS" | "IDENTIDADE_NAO_CONFIRMADA" | "ERRO";
      message: string;
    };

export async function saveRsvp(input: RsvpInput): Promise<RsvpActionResult> {
  const parsed = parseRsvpInput(input);
  if (!parsed.ok) {
    return { ok: false, error: "DADOS_INVALIDOS", message: parsed.error };
  }

  const admin = createAdminClient();
  const { name, phone, rsvp, companions, notes, guestToken } = parsed.value;
  const { data: existing, error: lookupError } = await admin
    .from("guests")
    .select("id, token")
    .eq("phone", phone)
    .maybeSingle();

  if (lookupError) {
    console.error("rsvp lookup:", lookupError.message);
    return {
      ok: false,
      error: "ERRO",
      message: "Não foi possível salvar agora. Tente novamente.",
    };
  }

  if (existing) {
    if (!guestToken || existing.token !== guestToken) {
      return {
        ok: false,
        error: "IDENTIDADE_NAO_CONFIRMADA",
        message:
          "Este WhatsApp já está cadastrado. Use o aparelho em que você reservou o presente ou fale com os noivos.",
      };
    }

    const { error } = await admin
      .from("guests")
      .update({
        name,
        rsvp,
        companions,
        rsvp_notes: notes,
        rsvp_at: new Date().toISOString(),
        notes_approved: false,
      })
      .eq("id", existing.id)
      .eq("token", guestToken);

    if (error) {
      console.error("rsvp update:", error.message);
      return {
        ok: false,
        error: "ERRO",
        message: "Não foi possível atualizar agora. Tente novamente.",
      };
    }

    revalidatePath("/admin/convidados");
    revalidatePath("/admin/recados");
    revalidatePath("/recados");
    return { ok: true, guestToken: existing.token, attendance: rsvp };
  }

  const { data: created, error } = await admin
    .from("guests")
    .insert({
      name,
      phone,
      rsvp,
      companions,
      rsvp_notes: notes,
      rsvp_at: new Date().toISOString(),
      notes_approved: false,
    })
    .select("token")
    .single();

  if (error || !created) {
    if (error?.code === "23505") {
      return {
        ok: false,
        error: "IDENTIDADE_NAO_CONFIRMADA",
        message:
          "Este WhatsApp acabou de ser cadastrado em outro aparelho. Atualize a página e tente novamente.",
      };
    }
    console.error("rsvp insert:", error?.message);
    return {
      ok: false,
      error: "ERRO",
      message: "Não foi possível salvar agora. Tente novamente.",
    };
  }

  revalidatePath("/admin/convidados");
  revalidatePath("/admin/recados");
  return { ok: true, guestToken: created.token, attendance: rsvp };
}
