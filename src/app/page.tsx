import Image from "next/image";
import Link from "next/link";
import Countdown from "@/components/Countdown";
import CoupleStorySection from "@/components/CoupleStorySection";
import GiftCard from "@/components/GiftCard";
import WeddingGallery from "@/components/WeddingGallery";
import WeddingInspiration from "@/components/WeddingInspiration";
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
              <Link href="#recados" className="btn btn-ghost">
                Ver recados
              </Link>
            </div>
          </div>
          <div className="home-cover-art">
            <Image
              src="/images/ensaio/principal-1.jpg"
              alt="Carol e Denys juntos no campo durante o ensaio"
              fill
              priority
              sizes="(max-width: 900px) 92vw, 46vw"
              className="home-cover-photo"
            />
            <span className="home-cover-index">C · D</span>
            <div className="home-cover-caption">
              <span>Casa do Lago</span>
              <small>31.01.2027</small>
            </div>
          </div>
        </div>
      </section>

      <CoupleStorySection id="nos" />

      <WeddingInspiration />

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

      <figure className="home-photo-break">
        <Image
          src="/images/ensaio/principal-2.jpg"
          alt="Carol e Denys dançando juntos no campo"
          width={1365}
          height={2048}
          sizes="100vw"
        />
        <figcaption>
          <span>31 · 01 · 2027</span>
          <strong>O nosso próximo passo.</strong>
        </figcaption>
      </figure>

      <WeddingGallery />

      <section className="home-event-note" aria-label="Informações da cerimônia">
        <div className="container home-event-note-grid">
          <p className="home-event-note-number">31</p>
          <div>
            <p className="eyebrow">O encontro</p>
            <h2>Casa do Lago</h2>
          </div>
          <address>
            Domingo · 16h
            <span>R. Beija-flor · Costazul · Rio das Ostras — RJ</span>
          </address>
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
