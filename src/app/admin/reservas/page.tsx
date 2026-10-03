import Link from "next/link";
import AdminManagementNotice from "@/components/AdminManagementNotice";
import AdminReservationActions from "@/components/AdminReservationActions";
import { adminManagementReady } from "@/lib/admin-management";
import { ACTIVE_RESERVATION_STATUSES, RESERVATION_STATUSES } from "@/lib/admin-management-rules";
import { filterAdminReservations, getAdminReservations } from "@/lib/admin-reservations";
import { formatBRL } from "@/lib/format";
import { whatsappUrl } from "@/lib/reservation-whatsapp";

export const dynamic = "force-dynamic";
const dates = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

export default async function AdminReservationsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; type?: string }> }) {
  const [params, { reservations, total }, ready] = await Promise.all([searchParams, getAdminReservations(), adminManagementReady()]);
  const q = typeof params.q === "string" ? params.q.slice(0, 200) : "";
  const status = ["ALL", "ACTIVE", ...RESERVATION_STATUSES].includes(params.status ?? "") ? params.status! : "ACTIVE";
  const type = ["ALL", "LINK", "COTAS", "LIVRE"].includes(params.type ?? "") ? params.type! : "ALL";
  const rows = filterAdminReservations(reservations, q, status, type);
  const exportQuery = new URLSearchParams({ q, status, type });
  return <main className="admin-page">
    <header className="admin-page-head"><div><p className="eyebrow">Controle dos presentes</p><h1>Reservas</h1></div><p>Cancele com motivo, confirme recebimentos e consulte o histórico.</p></header>
    {!ready && <AdminManagementNotice />}
    <section className="admin-metrics" aria-label="Resumo das reservas carregadas">
      <article><span>Ativas</span><strong>{reservations.filter(row => ACTIVE_RESERVATION_STATUSES.includes(row.status)).length}</strong></article>
      <article><span>Canceladas ou expiradas</span><strong>{reservations.filter(row => ["CANCELADO", "EXPIRADO"].includes(row.status)).length}</strong></article>
      <article><span>Total registrado</span><strong>{total}</strong></article>
    </section>
    <form className="admin-filters" method="get">
      <label>Buscar convidado, telefone ou presente<input name="q" defaultValue={q} maxLength={200} /></label>
      <label>Status<select name="status" defaultValue={status}><option value="ACTIVE">Ativas</option><option value="ALL">Todos</option>{RESERVATION_STATUSES.map(value => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></label>
      <label>Tipo<select name="type" defaultValue={type}><option value="ALL">Todos</option><option value="LINK">Loja</option><option value="COTAS">Cotas</option><option value="LIVRE">Valor livre</option></select></label>
      <button className="btn">Filtrar</button><Link href="/admin/reservas" className="text-link">Limpar filtros</Link>
    </form>
    <p className="admin-results">{rows.length} reserva(s) nesta seleção · <a href={`/admin/reservas/exportar?${exportQuery}`}>Exportar seleção em CSV</a></p>
    {total > reservations.length && <p role="status">Exibindo as 1.000 reservas mais recentes. A exportação usa esse mesmo limite.</p>}
    <section className="admin-reservations" aria-label="Reservas encontradas">
      {rows.map(row => {
        const contact = row.phone ? whatsappUrl(row.phone, `Olá, ${row.name}! Sobre sua reserva de ${row.title} para o casamento de Carol e Denys.`) : null;
        return <article key={row.id}>
          <div className="admin-reservation-head"><div><h2>{row.name}</h2><p><Link href={`/admin/presentes/${row.giftId}`}>{row.title}</Link> · {row.type}</p></div><span className="admin-status">{row.status.replaceAll("_", " ")}</span></div>
          <p>{row.phone ?? "Telefone não informado"}{row.shares ? ` · ${row.shares} cota(s)` : ""}{row.amountCents != null ? ` · ${formatBRL(row.amountCents)}` : ""}</p>
          <p>Reservado em {dates.format(new Date(row.createdAt))}{row.expiresAt ? ` · Prazo: ${dates.format(new Date(row.expiresAt))}` : ""}</p>
          {contact && <a href={contact} className="text-link" target="_blank" rel="noopener noreferrer">Contatar pelo WhatsApp ↗</a>}
          {row.status === "EM_ANALISE" && <p><Link href="/admin">Conferir comprovante na fila de pagamentos →</Link></p>}
          <AdminReservationActions id={row.id} type={row.type} status={row.status} enabled={ready} />
        </article>;
      })}
      {rows.length === 0 && <p>Nenhuma reserva encontrada com estes filtros.</p>}
    </section>
  </main>;
}
