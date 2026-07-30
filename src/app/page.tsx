import Link from "next/link";
import Countdown from "@/components/Countdown";
import CoupleStorySection from "@/components/CoupleStorySection";
import GiftCard from "@/components/GiftCard";
import LakeMark from "@/components/LakeMark";
import { getGifts } from "@/lib/gifts";
import { getPublicMessages } from "@/lib/public-messages";

// Revalida a cada 30s para a prévia de presentes acompanhar o banco.
export const revalidate = 30;

const messageDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export default async function Home() {
  const [gifts, messages] = await Promise.all([
    getGifts(),
    getPublicMessages(),
  ]);
  const preview = gifts.slice(0, 3);
  const messagePreview = messages.slice(0, 2);

  return (
    <main className="home-page">
      <section id="inicio" className="home-cover">
        <div className="container home-cover-grid">
          <div className="home-cover-copy">
            <p className="eyebrow">Vamos casar</p>
            <p className="home-overline">Domingo · 16h</p>
            <h1 className="home-names">
              <span>Carol</span>
              <i>&amp;</i>
              <span>Denys</span>
            </h1>
            <p className="home-date">31 · Janeiro · 2027</p>
            <p className="home-place">
              Casa do Lago
              <small>Costazul · Rio das Ostras — RJ</small>
            </p>

            <Countdown />

            <div className="home-actions">
              <Link href="#presentes" className="btn">
                Lista de presentes
              </Link>
              <Link href="#presenca" className="btn btn-ghost">
                Confirmar presença
              </Link>
            </div>
          </div>
          <div className="home-cover-art">
            <span className="home-cover-index">C · D</span>
            <LakeMark />
            <div className="home-cover-caption">
              <span>Casa do Lago</span>
              <small>31.01.2027</small>
            </div>
          </div>
        </div>
      </section>

      <CoupleStorySection id="nos" />

      <section
        id="presentes"
        className="section home-gifts home-anchor-section"
      >
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Presentear</p>
            <h2>Nossa lista</h2>
            <p>
              Alguns presentes dividimos em cotas — você escolhe quantas quer dar e
              paga por PIX. Quando todas são preenchidas, ele é nosso. 💝
            </p>
          </div>
          {preview.length > 0 ? (
            <div className="gift-grid">
              {preview.map((g) => (
                <GiftCard key={g.id} gift={g} />
              ))}
            </div>
          ) : (
            <p className="home-section-empty">
              Nossa lista está sendo preparada com carinho.
            </p>
          )}
          <div className="home-gifts-action">
            <Link href="/presentes" className="btn">
              Ver todos os presentes
            </Link>
          </div>
        </div>
      </section>

      <section id="presenca" className="home-rsvp home-anchor-section">
        <div className="container home-rsvp-grid">
          <div className="home-rsvp-copy">
            <p className="eyebrow">Presença</p>
            <h2>Esperamos você para celebrar com a gente.</h2>
            <p>
              A cerimônia começa às 16h, na Casa do Lago, em Costazul. Confirme
              quem vai com você para prepararmos tudo com carinho.
            </p>
            <Link href="/confirmar" className="btn btn-light">
              Confirmar presença
            </Link>
          </div>
          <aside className="home-rsvp-card" aria-label="Informações da cerimônia">
            <p className="home-rsvp-number">31</p>
            <p className="home-rsvp-month">Janeiro de 2027</p>
            <div className="home-rsvp-rule" aria-hidden="true" />
            <p>Domingo · 16h</p>
            <strong>Casa do Lago</strong>
            <address>
              R. Beija-flor · Costazul
              <br />
              Rio das Ostras — RJ
            </address>
          </aside>
        </div>
      </section>

      <section id="recados" className="home-messages home-anchor-section">
        <div className="container">
          <div className="home-messages-head">
            <div>
              <p className="eyebrow">Com carinho</p>
              <h2>Recados para nós</h2>
            </div>
            <p>
              Palavras de quem faz parte da nossa história e já está celebrando
              esse dia com a gente.
            </p>
          </div>

          {messagePreview.length > 0 ? (
            <div className="home-message-grid">
              {messagePreview.map((message) => (
                <blockquote
                  key={`${message.name}-${message.createdAt}`}
                  className="home-message-preview"
                >
                  <p>“{message.message}”</p>
                  <footer>
                    <strong>{message.name}</strong>
                    <time dateTime={message.createdAt}>
                      {messageDateFormatter.format(new Date(message.createdAt))}
                    </time>
                  </footer>
                </blockquote>
              ))}
            </div>
          ) : (
            <p className="home-section-empty">
              Os primeiros recados vão aparecer aqui.
            </p>
          )}

          <div className="home-messages-action">
            <Link href="/recados" className="text-link">
              Ver todos os recados <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
