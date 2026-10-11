import { getAdminOverview } from "@/lib/admin-overview";
import { filterOverview } from "@/lib/admin-overview-rules";
import { csvCell } from "@/lib/admin-management-rules";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const overview = await getAdminOverview();
  const state = params.get("state") ?? "ALL";
  const rows = filterOverview(overview.rows, { q: (params.get("q") ?? "").slice(0,200), state: ["ALL","RESERVED","AVAILABLE","COMPLETE","REVIEW","MISSING","HIDDEN"].includes(state) ? state : "ALL",
    type: params.get("type") ?? "ALL", category: params.get("category") ?? "ALL", sort: params.get("sort") ?? "CATALOG" });
  const csv = "\uFEFF" + [["Presente","Tipo","Categoria","Oculto","Previsto (centavos)","Recebido (centavos)","Reserva pendente (centavos)","Recebido (%)","Cotas disponíveis","Reservado por"],
    ...rows.map(row => [row.title,row.type,row.category,row.hidden ? "Sim" : "Não",String(row.target ?? ""),String(row.received),String(row.pending),String(row.percent ?? ""),String(row.available ?? ""),row.names.join(" / ")])]
    .map(row => row.map(csvCell).join(";")).join("\r\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="resumo-presentes-carol-e-denys.csv"', "Cache-Control": "private, no-store" } });
}
