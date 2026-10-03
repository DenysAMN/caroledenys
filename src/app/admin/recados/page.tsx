import Link from "next/link";
import AdminManagementNotice from "@/components/AdminManagementNotice";
import { adminManagementReady } from "@/lib/admin-management";
import AdminMessageActions from "@/components/AdminMessageActions";
import { getAdminMessages } from "@/lib/admin-messages";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default async function AdminMessagesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; source?: string }> }) {
  const [allMessages, ready, params] = await Promise.all([getAdminMessages(), adminManagementReady(), searchParams]);
  const q = typeof params.q === "string" ? params.q.slice(0, 200) : "";
  const status = params.status === "PUBLISHED" || params.status === "HIDDEN" ? params.status : "ALL";
  const source = params.source === "CLAIM" || params.source === "RSVP" ? params.source : "ALL";
  const messages = allMessages.filter(row => (!q || `${row.name} ${row.context} ${row.message}`.toLocaleLowerCase("pt-BR").includes(q.toLocaleLowerCase("pt-BR")))
    && (status === "ALL" || (status === "PUBLISHED" ? row.approved : !row.approved)) && (source === "ALL" || row.source === source));
  const pending = allMessages.filter((message) => !message.approved).length;

  return (
    <main className="admin-page">
      <header className="admin-page-head">
        <div>
          <p className="eyebrow">Livro de visitas</p>
          <h1>Recados</h1>
        </div>
        <p>Leia antes de publicar. Ocultar retira do mural sem apagar o texto.</p>
      </header>

      {!ready && <AdminManagementNotice />}

      <section className="admin-metrics admin-message-metrics" aria-label="Resumo">
        <article>
          <span>Aguardando leitura</span>
          <strong>{pending}</strong>
        </article>
        <article>
          <span>Publicados</span>
          <strong>{allMessages.length - pending}</strong>
        </article>
        <article>
          <span>Total recebido</span>
          <strong>{allMessages.length}</strong>
        </article>
      </section>

      <form className="admin-filters" method="get">
        <label>Buscar nome ou texto<input name="q" defaultValue={q} maxLength={200} /></label>
        <label>Estado<select name="status" defaultValue={status}><option value="ALL">Todos</option><option value="PUBLISHED">Publicados</option><option value="HIDDEN">Pendentes ou ocultos</option></select></label>
        <label>Origem<select name="source" defaultValue={source}><option value="ALL">Todas</option><option value="CLAIM">Presente</option><option value="RSVP">RSVP histórico</option></select></label>
        <button className="btn">Filtrar</button><Link href="/admin/recados" className="text-link">Limpar filtros</Link>
      </form>
      <p className="admin-results">{messages.length} recado(s) nesta seleção.</p>

      {messages.length > 0 ? (
        <section className="admin-message-list" aria-label="Recados recebidos">
          {messages.map((message, index) => (
            <article
              className={`admin-message${message.approved ? " is-approved" : ""}`}
              key={`${message.source}-${message.id}`}
            >
              <span className="admin-message-index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="admin-message-copy">
                <div className="admin-message-meta">
                  <span>{message.source === "CLAIM" ? "Presente" : "RSVP"}</span>
                  <time dateTime={message.createdAt}>
                    {dateFormatter.format(new Date(message.createdAt))}
                  </time>
                </div>
                <blockquote>“{message.message}”</blockquote>
                <p><strong>{message.name}</strong> · {message.context}</p>
              </div>
              <div className="admin-message-decision">
                <span className={`admin-status ${message.approved ? "admin-status-disponivel" : ""}`}>
                  {message.approved ? "Publicado" : "Pendente"}
                </span>
                <AdminMessageActions
                  id={message.id}
                  source={message.source}
                  approved={message.approved}
                  originalText={message.message}
                  editingEnabled={ready}
                />
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div className="admin-empty">
          <span>00</span>
          <h2>Nenhum recado encontrado</h2>
          <p>Tente outros filtros. Novos recados aparecem aqui para sua leitura.</p>
        </div>
      )}
    </main>
  );
}
