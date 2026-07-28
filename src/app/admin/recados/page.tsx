import AdminMessageActions from "@/components/AdminMessageActions";
import { getAdminMessages } from "@/lib/admin-messages";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default async function AdminMessagesPage() {
  const messages = await getAdminMessages();
  const pending = messages.filter((message) => !message.approved).length;

  return (
    <main className="admin-page">
      <header className="admin-page-head">
        <div>
          <p className="eyebrow">Livro de visitas</p>
          <h1>Recados</h1>
        </div>
        <p>Leia antes de publicar. Ocultar retira do mural sem apagar o texto.</p>
      </header>

      <section className="admin-metrics admin-message-metrics" aria-label="Resumo">
        <article>
          <span>Aguardando leitura</span>
          <strong>{pending}</strong>
        </article>
        <article>
          <span>Publicados</span>
          <strong>{messages.length - pending}</strong>
        </article>
        <article>
          <span>Total recebido</span>
          <strong>{messages.length}</strong>
        </article>
      </section>

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
                />
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div className="admin-empty">
          <span>00</span>
          <h2>Nenhum recado recebido</h2>
          <p>Quando alguém escrever, o texto aparecerá aqui para sua leitura.</p>
        </div>
      )}
    </main>
  );
}
