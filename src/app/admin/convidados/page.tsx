import { getAdminGuests } from "@/lib/admin-guests";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function rsvpLabel(status: "CONFIRMADO" | "NAO_VOU" | null) {
  if (status === "CONFIRMADO") return "Confirmado";
  if (status === "NAO_VOU") return "Não vai";
  return "Sem resposta";
}

export default async function AdminGuestsPage() {
  const { guests, metrics } = await getAdminGuests();

  return (
    <main className="admin-page">
      <header className="admin-page-head">
        <div>
          <p className="eyebrow">Lista de presença</p>
          <h1>Convidados</h1>
        </div>
        <a className="btn" href="/admin/convidados/exportar">Exportar CSV</a>
      </header>

      <section className="admin-metrics admin-guest-metrics" aria-label="Resumo">
        <article>
          <span>Total que vai</span>
          <strong>{metrics.totalAttending}</strong>
        </article>
        <article>
          <span>Convidados + acompanhantes</span>
          <strong>{metrics.confirmedGuests} + {metrics.companions}</strong>
        </article>
        <article>
          <span>Não vão / sem resposta</span>
          <strong>{metrics.declined} / {metrics.unanswered}</strong>
        </article>
      </section>

      <section className="admin-guest-list" aria-label="Lista de convidados">
        <header>
          <span>Nome</span>
          <span>Contato</span>
          <span>Resposta</span>
          <span>Acompanhantes</span>
          <span>Data</span>
        </header>
        {guests.map((guest) => (
          <article key={guest.id}>
            <div className="admin-guest-name">
              <strong>{guest.name}</strong>
              {guest.rsvpNotes && <small>{guest.rsvpNotes}</small>}
            </div>
            {guest.phone ? (
              <a
                href={`https://wa.me/${guest.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {guest.phone}
              </a>
            ) : (
              <span>Sem telefone</span>
            )}
            <span className={`admin-status ${
              guest.rsvp === "CONFIRMADO" ? "admin-status-disponivel" : ""
            }`}>
              {rsvpLabel(guest.rsvp)}
            </span>
            <span>{guest.companions}</span>
            <time dateTime={guest.rsvpAt ?? guest.createdAt}>
              {dateFormatter.format(new Date(guest.rsvpAt ?? guest.createdAt))}
            </time>
          </article>
        ))}
      </section>
    </main>
  );
}
