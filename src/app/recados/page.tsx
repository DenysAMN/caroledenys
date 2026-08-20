import type { Metadata } from "next";
import Link from "next/link";
import { getPublicMessages } from "@/lib/public-messages";

export const metadata: Metadata = {
  title: "Recados",
  description: "O livro de visitas do casamento de Carol e Denys.",
};

export const revalidate = 30;

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export default async function RecadosPage() {
  const messages = await getPublicMessages();

  return (
    <main className="guestbook-page">
      <div className="container">
        <header className="guestbook-head">
          <p className="eyebrow">Livro de visitas</p>
          <hr className="rule" />
          <h1>Palavras que ficam</h1>
          <p>
            Carinhos enviados por quem caminha com a gente. Cada recado é lido
            pelos noivos antes de aparecer aqui.
          </p>
        </header>

        {messages.length > 0 ? (
          <ol className="guestbook-list">
            {messages.map((entry, index) => (
              <li key={`${entry.source}-${entry.createdAt}-${index}`}>
                <span className="guestbook-index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <blockquote>“{entry.message}”</blockquote>
                <footer>
                  <strong>{entry.name}</strong>
                  <span aria-hidden="true">·</span>
                  <time dateTime={entry.createdAt}>
                    {dateFormatter.format(new Date(entry.createdAt))}
                  </time>
                </footer>
              </li>
            ))}
          </ol>
        ) : (
          <div className="guestbook-empty">
            <span aria-hidden="true">“ ”</span>
            <h2>As primeiras páginas estão esperando.</h2>
            <p>
              Os recados enviados com presentes aparecerão aqui depois de
              aprovados.
            </p>
          </div>
        )}

        <div className="guestbook-foot">
          <Link href="/" className="btn">Voltar ao início</Link>
          <Link href="/presentes" className="btn btn-ghost">Ver presentes</Link>
        </div>
      </div>
    </main>
  );
}
