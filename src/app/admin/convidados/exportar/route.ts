import { buildGuestsCsv } from "@/lib/admin-guest-rules";
import { getAdminGuests } from "@/lib/admin-guests";

export const dynamic = "force-dynamic";

export async function GET() {
  const { guests } = await getAdminGuests();
  const csv = buildGuestsCsv(guests);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="convidados-carol-e-denys.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
