import { buildReservationsCsv, filterAdminReservations, getAdminReservations } from "@/lib/admin-reservations";
import { RESERVATION_STATUSES } from "@/lib/admin-management-rules";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const { reservations } = await getAdminReservations();
  const rawStatus = params.get("status") ?? "ACTIVE";
  const status = ["ALL", "ACTIVE", ...RESERVATION_STATUSES].includes(rawStatus) ? rawStatus : "ACTIVE";
  const rawType = params.get("type") ?? "ALL";
  const type = ["ALL", "LINK", "COTAS", "LIVRE"].includes(rawType) ? rawType : "ALL";
  const rows = filterAdminReservations(reservations, (params.get("q") ?? "").slice(0, 200), status, type);
  return new Response(buildReservationsCsv(rows), { headers: {
    "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="reservas-carol-e-denys.csv"', "Cache-Control": "private, no-store",
  } });
}
