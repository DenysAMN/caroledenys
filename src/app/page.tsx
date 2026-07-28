import Link from "next/link";
import Countdown from "@/components/Countdown";
import GiftCard from "@/components/GiftCard";
import LakeMark from "@/components/LakeMark";
import { getGifts } from "@/lib/gifts";

// Revalida a cada 30s para a prévia de presentes acompanhar o banco.
export const revalidate = 30;

export default async function Home() {
  const gifts = await getGifts();
  const preview = gifts.slice(0, 3);

  return (
    <main className="home-page">
      <section className="home-cover">
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
              <Link href="/presentes" className="btn">
                Lista de presentes
              </Link>
              <Link href="/confirmar" className="btn btn-ghost">
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

      <section className="home-intro">
        <div className="container home-intro-grid">
          <div className="home-intro-copy">
            <p className="eyebrow">Nosso dia</p>
            <h2>Um domingo para guardar.</h2>
            <p>
              Estamos preparando um encontro para celebrar o amor e reunir as
              pessoas que fazem parte da nossa vida. A Casa do Lago abre as
              portas, e a gente espera por você.
            </p>
            <Link href="/nos" className="text-link">
              Conheça a celebração <span aria-hidden="true">→</span>
            </Link>
          </div>
          <aside className="home-date-card" aria-label="Data e local do casamento">
            <time dateTime="2027-01-31T16:00:00-03:00">
              <strong>31</strong>
              <span>Janeiro</span>
              <small>2027 · 16h</small>
            </time>
            <div>
              <span>Casa do Lago</span>
              <small>Rio das Ostras · RJ</small>
            </div>
          </aside>
        </div>
      </section>

      {preview.length > 0 && (
        <section className="section home-gifts">
          <div className="container">
            <div className="section-head">
              <p className="eyebrow">Presentear</p>
              <h2>Nossa lista</h2>
              <p>
                Alguns presentes dividimos em cotas — você escolhe quantas quer dar e
                paga por PIX. Quando todas são preenchidas, ele é nosso. 💝
              </p>
            </div>
            <div className="gift-grid">
              {preview.map((g) => (
                <GiftCard key={g.id} gift={g} />
              ))}
            </div>
            <div className="home-gifts-action">
              <Link href="/presentes" className="btn">
                Ver todos os presentes
              </Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
