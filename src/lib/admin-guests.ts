import "server-only";

import { requireAdmin } from "@/lib/admin-auth";
import {
  calculateRsvpMetrics,
  type GuestCsvRow,
  type RsvpMetrics,
} from "@/lib/admin-guest-rules";
import { createAdminClient } from "@/lib/supabaseAdmin";

export type AdminGuest = GuestCsvRow & {
  id: string;
  createdAt: string;
};

export async function getAdminGuests(): Promise<{
  guests: AdminGuest[];
  metrics: RsvpMetrics;
}> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("guests")
    .select(
      "id, name, phone, rsvp, companions, rsvp_notes, rsvp_at, created_at"
    )
    .order("name", { ascending: true });

  if (error) throw new Error(`Convidados: ${error.message}`);

  const guests = (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    rsvp: row.rsvp,
    companions: row.companions,
    rsvpNotes: row.rsvp_notes,
    rsvpAt: row.rsvp_at,
    createdAt: row.created_at,
  })) as AdminGuest[];

  return { guests, metrics: calculateRsvpMetrics(guests) };
}
