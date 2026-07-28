import "server-only";

import { requireAdmin } from "@/lib/admin-auth";
import type { MessageSource } from "@/lib/admin-message-rules";
import { createAdminClient } from "@/lib/supabaseAdmin";

export type AdminMessage = {
  id: string;
  source: MessageSource;
  name: string;
  context: string;
  message: string;
  approved: boolean;
  createdAt: string;
};

type RelationName = { name: string } | { name: string }[] | null;
type RelationTitle = { title: string } | { title: string }[] | null;

function first<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function getAdminMessages(): Promise<AdminMessage[]> {
  await requireAdmin();
  const admin = createAdminClient();
  const [claimsResult, guestsResult] = await Promise.all([
    admin
      .from("claims")
      .select(
        "id, message, message_approved, created_at, guests(name), gifts(title)"
      )
      .not("message", "is", null),
    admin
      .from("guests")
      .select("id, name, rsvp_notes, notes_approved, rsvp_at, created_at")
      .not("rsvp_notes", "is", null),
  ]);

  if (claimsResult.error || guestsResult.error) {
    throw new Error(
      `Recados: ${claimsResult.error?.message ?? guestsResult.error?.message}`
    );
  }

  const claimMessages: AdminMessage[] = (claimsResult.data ?? []).flatMap(
    (row) => {
      const message = row.message?.trim();
      if (!message) return [];
      const guest = first(row.guests as RelationName);
      const gift = first(row.gifts as RelationTitle);
      return [
        {
          id: row.id,
          source: "CLAIM",
          name: guest?.name ?? "Convidado",
          context: gift?.title ?? "Presente",
          message,
          approved: row.message_approved,
          createdAt: row.created_at,
        },
      ];
    }
  );

  const rsvpMessages: AdminMessage[] = (guestsResult.data ?? []).flatMap(
    (row) => {
      const message = row.rsvp_notes?.trim();
      if (!message) return [];
      return [
        {
          id: row.id,
          source: "RSVP",
          name: row.name,
          context: "Confirmação de presença",
          message,
          approved: row.notes_approved,
          createdAt: row.rsvp_at ?? row.created_at,
        },
      ];
    }
  );

  return [...claimMessages, ...rsvpMessages].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}
