import "server-only";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { ACTIVE_RESERVATION_STATUSES, csvCell } from "@/lib/admin-management-rules";

export type AdminReservation = {
  id: string; giftId: string; title: string; type: string; status: string;
  name: string; phone: string | null; amountCents: number | null; shares: number | null;
  createdAt: string; expiresAt: string | null;
};

export async function getAdminReservations() {
  await requireAdmin();
  const { data, error, count } = await createAdminClient().from("claims")
    .select("id, gift_id, status, shares, amount_cents, created_at, expires_at, guests(name, phone), gifts(title, type)", { count: "exact" })
    .order("created_at", { ascending: false }).limit(1000);
  if (error) throw new Error("Não foi possível carregar as reservas.");
  const reservations: AdminReservation[] = (data ?? []).map(row => {
    const guest = Array.isArray(row.guests) ? row.guests[0] : row.guests;
    const gift = Array.isArray(row.gifts) ? row.gifts[0] : row.gifts;
    return { id: row.id, giftId: row.gift_id, title: gift?.title ?? "Presente", type: gift?.type ?? "", status: row.status,
      name: guest?.name ?? "Convidado", phone: guest?.phone ?? null, amountCents: row.amount_cents,
      shares: row.shares, createdAt: row.created_at, expiresAt: row.expires_at };
  });
  return { reservations, total: count ?? reservations.length };
}

export function filterAdminReservations(rows: AdminReservation[], q: string, status: string, type: string) {
  const search = q.trim().toLocaleLowerCase("pt-BR");
  return rows.filter(row => (!search || `${row.name} ${row.title} ${row.phone ?? ""} ${row.id}`.toLocaleLowerCase("pt-BR").includes(search))
    && (status === "ALL" || (status === "ACTIVE" ? ACTIVE_RESERVATION_STATUSES.includes(row.status) : row.status === status))
    && (type === "ALL" || row.type === type));
}

export function buildReservationsCsv(rows: AdminReservation[]) {
  return "\uFEFF" + [["Reserva", "Convidado", "WhatsApp", "Presente", "Tipo", "Status", "Cotas", "Valor (centavos)", "Criada em", "Expira em"],
    ...rows.map(row => [row.id, row.name, row.phone ?? "", row.title, row.type, row.status, String(row.shares ?? ""), String(row.amountCents ?? ""), row.createdAt, row.expiresAt ?? ""])]
    .map(row => row.map(csvCell).join(";")).join("\r\n");
}
