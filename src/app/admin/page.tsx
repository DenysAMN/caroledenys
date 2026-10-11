import Link from "next/link";
import AdminQueue from "@/components/AdminQueue";
import { getAdminOverview } from "@/lib/admin-overview";
import { filterOverview, type OverviewFilters } from "@/lib/admin-overview-rules";
import { getPendingPayments } from "@/lib/admin-payments";
import { formatBRL } from "@/lib/format";

export const dynamic = "force-dynamic";
const percentages = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
const pct = (value: number | null) => value === null ? "Sem meta definida" : `${percentages.format(value)}%`;
type Params = { [key: string]: string | string[] | undefined };
const text = (params: Params, key: string, fallback = "") => typeof params[key] === "string" ? params[key].slice(0,200) : fallback;
const choice = (params: Params, key: string, values: string[], fallback: string) => values.includes(text(params,key)) ? text(params,key) : fallback;

export default async function AdminDashboardPage({ searchParams }: { searchParams: Promise<Params> }) {
  const [overview, payments, params] = await Promise.all([getAdminOverview(), getPendingPayments(), searchParams]);
  const categories = [...new Set(overview.rows.map(row => row.category))].sort((a,b) => a.localeCompare(b,"pt-BR"));
  const filters: OverviewFilters = { q: text(params,"q"), state: choice(params,"state",["ALL","RESERVED","AVAILABLE","COMPLETE","REVIEW","MISSING","HIDDEN"],"ALL"),
    type: choice(params,"type",["ALL","LINK","COTAS","LIVRE"],"ALL"), category: choice(params,"category",["ALL",...categories],"ALL"),
    sort: choice(params,"sort",["CATALOG","MISSING","RECEIVED","TITLE"],"CATALOG") };
  const rows = filterOverview(overview.rows,filters);
  const exportQuery = new URLSearchParams(filters);
  const queueQ = text(params,"queue_q");
  const queueType = choice(params,"queue_type",["ALL","COTAS","LIVRE"],"ALL");
  const queueOrder = choice(params,"queue_order",["OLDEST","NEWEST","AMOUNT"],"OLDEST");
  const queue = payments.filter(payment => (queueType === "ALL" || payment.giftType === queueType) && `${payment.guestName} ${payment.payerName} ${payment.giftTitle} ${payment.txid}`.toLocaleLowerCase("pt-BR").includes(queueQ.trim().toLocaleLowerCase("pt-BR")))
    .sort((a,b) => queueOrder === "AMOUNT" ? b.amountCents-a.amountCents : queueOrder === "NEWEST" ? b.createdAt.localeCompare(a.createdAt) : a.createdAt.localeCompare(b.createdAt));
  const selectedReceived = rows.reduce((sum,row) => sum+row.received,0);
  const selectedPending = rows.reduce((sum,row) => sum+row.pending,0);
  const updated = new Intl.DateTimeFormat("pt-BR",{ dateStyle:"short",timeStyle:"short",timeZone:"America/Sao_Paulo" }).format(new Date());
  return <main className="admin-page">
    <header className="admin-page-head"><div><p className="eyebrow">Visão dos noivos</p><h1>Conferência</h1></div><p>Atualizado em {updated}<br /><Link href="/admin">Atualizar resumo ↻</Link></p></header>
    <nav className="admin-overview-shortcuts" aria-label="Atalhos do resumo">
      <a className="btn" href="#conferencia">Conferir {overview.reviewCount} comprovante(s)</a>
      <a className="btn btn-ghost" href="#resumo-presentes">Ver todos os presentes</a>
      <Link className="text-link" href="/admin/reservas">Gerenciar reservas →</Link>
    </nav>
    <section className="admin-overview-metrics" aria-label="Resumo financeiro geral">
      <article><span>PIX confirmado</span><strong>{formatBRL(overview.pixReceived)}</strong><small>Pagamentos conferidos, incluindo valor livre e presentes ocultos.</small></article>
      <article><span>Presentes de loja recebidos</span><strong>{formatBRL(overview.linkReceived)}</strong><small>Estimativa pelos preços cadastrados; não é dinheiro recebido via PIX.</small></article>
      <article><span>PIX para conferir</span><strong>{formatBRL(overview.pixReview)}</strong><small>{overview.reviewCount} comprovante(s) aguardando aprovação.</small></article>
      <article><span>PIX aguardando envio</span><strong>{formatBRL(overview.pixWaiting)}</strong><small>Reservas aguardando pagamento/comprovante; ainda não confirmadas.</small></article>
    </section>
    <section className="admin-overview-progress" aria-label="Progresso do catálogo publicado">
      <div><p className="eyebrow">Catálogo publicado · valor previsto {formatBRL(overview.target)}</p><h2>Quanto já conseguimos?</h2>
        <label htmlFor="received-progress">Recebido/confirmado <strong>{pct(overview.receivedPercent)}</strong></label><progress id="received-progress" value={overview.receivedPercent ?? 0} max={100} />
        <p>{formatBRL(overview.received)} recebidos de {formatBRL(overview.target)}.</p>
        <label htmlFor="reserved-progress">Coberto por recebimentos e reservas <strong>{pct(overview.reservedPercent)}</strong></label><progress id="reserved-progress" className="is-reserved" value={overview.reservedPercent ?? 0} max={100} />
        <p>{formatBRL(overview.reserved)} já recebidos ou comprometidos. Reserva não é confirmação de pagamento.</p>
      </div>
      <div className="admin-overview-remaining"><span>Falta receber</span><strong>{formatBRL(overview.missing)}</strong><small>Inclui o que já está reservado, mas ainda não foi recebido.</small><span>Ainda sem reserva</span><strong>{formatBRL(overview.unreserved)}</strong><small>Valor do catálogo que ainda pode ser coberto.</small></div>
      <p className="admin-overview-note">Percentuais usam somente presentes publicados com valor definido: preços de loja e quantidade de cotas × valor da cota. Contribuições livres e presentes ocultos ficam fora da meta. {overview.unknownPriceCount > 0 ? `${overview.unknownPriceCount} presente(s) sem preço também ficam fora da porcentagem.` : ""}</p>
    </section>
    <section id="resumo-presentes" className="admin-overview-section">
      <header className="admin-section-head"><p className="eyebrow">Situação do catálogo</p><h2>Presentes e reservas</h2><p>{overview.visibleCount} publicados · {overview.reservedCount} com reserva/recebimento · {overview.completeCount} totalmente recebidos · {overview.availableCount} ainda disponíveis</p></header>
      <form className="admin-filters" method="get" action="/admin#resumo-presentes">
        <label>Buscar presente ou convidado<input name="q" defaultValue={filters.q} maxLength={200} /></label>
        <label>Situação<select name="state" defaultValue={filters.state}><option value="ALL">Todos publicados</option><option value="RESERVED">Com reserva ou recebimento</option><option value="AVAILABLE">Ainda disponíveis</option><option value="COMPLETE">Totalmente recebidos</option><option value="REVIEW">Com PIX para conferir</option><option value="MISSING">Ainda falta receber</option><option value="HIDDEN">Ocultos</option></select></label>
        <label>Tipo<select name="type" defaultValue={filters.type}><option value="ALL">Todos</option><option value="LINK">Loja</option><option value="COTAS">Cotas</option><option value="LIVRE">Valor livre</option></select></label>
        <label>Categoria<select name="category" defaultValue={filters.category}><option value="ALL">Todas</option>{categories.map(category => <option key={category}>{category}</option>)}</select></label>
        <label>Ordenar<select name="sort" defaultValue={filters.sort}><option value="CATALOG">Ordem do catálogo</option><option value="MISSING">Maior valor faltante</option><option value="RECEIVED">Maior valor recebido</option><option value="TITLE">Nome do presente</option></select></label>
        <input type="hidden" name="queue_q" value={queueQ} /><input type="hidden" name="queue_type" value={queueType} /><input type="hidden" name="queue_order" value={queueOrder} />
        <button className="btn">Filtrar</button><Link href="/admin#resumo-presentes" className="text-link">Limpar filtros</Link>
      </form>
      <p className="admin-results">{rows.length} presente(s) na seleção · {formatBRL(selectedReceived)} recebidos · {formatBRL(selectedPending)} reservados, ainda pendentes. Valores de loja são estimados. <a href={`/admin/resumo/exportar?${exportQuery}`}>Exportar seleção em CSV →</a></p>
      <div className="admin-overview-gifts">{rows.map(row => <article key={row.id}>
        <header><div><small>{row.type === "LINK" ? "Loja" : row.type === "COTAS" ? "Cotas" : "Valor livre"} · {row.category}</small><h3><Link href={`/admin/presentes/${row.id}`}>{row.title}</Link></h3></div><span className="admin-status">{row.hidden ? "Oculto" : row.complete ? "Recebido" : row.reserved ? "Com reserva" : "Sem reserva"}</span></header>
        <dl><div><dt>Previsto</dt><dd>{row.target === null ? row.type === "LIVRE" ? "Valor aberto" : "Preço não cadastrado" : formatBRL(row.target)}</dd></div><div><dt>Recebido{row.type === "LINK" ? " (estimado)" : ""}</dt><dd>{formatBRL(row.received)}</dd></div><div><dt>Reservado, pendente</dt><dd>{formatBRL(row.pending)}</dd></div><div><dt>Falta receber</dt><dd>{row.target === null ? "Sem meta" : formatBRL(Math.max(0,row.target-row.received))}</dd></div></dl>
        {row.percent !== null && <div className="admin-overview-gift-progress"><label htmlFor={`progress-${row.id}`}>{pct(row.percent)} recebidos</label><progress id={`progress-${row.id}`} value={row.percent} max={100} /></div>}
        <p>{row.type === "COTAS" ? `${row.takenShares} de ${row.totalShares} cotas comprometidas · ${row.available} disponíveis` : row.type === "LINK" ? row.available ? "Disponível para reservar" : row.complete ? "Entrega recebida" : "Reservado · entrega pendente" : "Contribuições sem limite de cotas"}</p>
        {row.review > 0 && <p className="admin-overview-alert">{formatBRL(row.review)} em comprovantes para conferir.</p>}
        <details><summary>Quem reservou ({row.names.length})</summary><p>{row.names.length ? row.names.join(" · ") : "Nenhuma reserva ativa registrada."}</p></details>
        <Link className="text-link" href={`/admin/presentes/${row.id}`}>Abrir detalhes e reservas →</Link>
      </article>)}</div>
      {rows.length === 0 && <div className="admin-empty"><h3>Nenhum presente nesta seleção</h3><p>Altere os filtros ou limpe a busca.</p></div>}
    </section>
    <section id="conferencia" className="admin-overview-section">
      <header className="admin-section-head"><p className="eyebrow">Pagamentos pendentes</p><h2>Comprovantes para conferir</h2><p>Confira o extrato bancário antes de confirmar. A aprovação continua sendo manual.</p></header>
      <form className="admin-filters" method="get" action="/admin#conferencia">
        <label>Buscar convidado, pagador, presente ou TXID<input name="queue_q" defaultValue={queueQ} maxLength={200} /></label>
        <label>Tipo<select name="queue_type" defaultValue={queueType}><option value="ALL">Todos</option><option value="COTAS">Cotas</option><option value="LIVRE">Valor livre</option></select></label>
        <label>Ordenar<select name="queue_order" defaultValue={queueOrder}><option value="OLDEST">Mais antigos primeiro</option><option value="NEWEST">Mais recentes primeiro</option><option value="AMOUNT">Maior valor primeiro</option></select></label>
        {Object.entries(filters).map(([key,value]) => <input type="hidden" key={key} name={key} value={value} />)}
        <button className="btn">Filtrar fila</button>
      </form>
      <p className="admin-results">{queue.length} de {payments.length} comprovante(s) · {formatBRL(queue.reduce((sum,payment) => sum+payment.amountCents,0))} na seleção.</p>
      {overview.reviewCount > payments.length && <p role="status">Há reservas em análise sem comprovante ou dados completos nesta fila. <Link href="/admin/reservas?status=EM_ANALISE">Ver todas as reservas em análise →</Link></p>}
      {queue.length || payments.length === 0 ? <AdminQueue payments={queue} /> : <p>Nenhum comprovante corresponde aos filtros. Limpe a busca ou mude o tipo.</p>}
    </section>
  </main>;
}
