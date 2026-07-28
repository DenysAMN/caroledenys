import type { Metadata } from "next";
import Link from "next/link";
import LakeMark from "@/components/LakeMark";

export const metadata: Metadata = {
  title: "Nós",
  description:
    "Conheça a celebração de Carol e Denys e veja os detalhes da Casa do Lago.",
};

const MAP_URL =
  "https://www.google.com/maps/search/?api=1&query=Casa+do+Lago+R.+Beija-flor+Costazul+Rio+das+Ostras+RJ+28895-048";

export default function NosPage() {
  return (
    <main className="nos-page">
      <section className="nos-hero">
        <div className="container nos-hero-grid">
          <div className="nos-hero-copy">
            <p className="eyebrow">Carol &amp; Denys</p>
            <hr className="rule" />
            <h1>Nosso próximo capítulo começa junto de vocês.</h1>
            <p>
              Mais do que marcar uma data, queremos criar uma lembrança com quem
              caminhou até aqui ao nosso lado.
            </p>
          </div>
          <div className="nos-hero-art">
            <LakeMark />
            <span>Rio das Ostras · verão de 2027</span>
          </div>
        </div>
      </section>

      <section className="nos-story">
        <div className="container nos-story-grid">
          <p className="nos-story-lead">
            “Um domingo sem pressa, com abraços demorados e todas as nossas
            pessoas preferidas no mesmo lugar.”
          </p>
          <div className="nos-story-copy">
            <p>
              Estamos preparando este casamento do jeito que mais importa para
              a gente: cercados pelas pessoas que fazem parte da nossa vida. No
              dia 31 de janeiro, queremos trocar a rotina por uma tarde inteira
              de encontros, conversas e celebração.
            </p>
            <p>
              Este site reúne o que você precisa para viver esse dia conosco.
              Confirme sua presença quando puder e, se quiser nos presentear,
              nossa lista foi pensada para ter escolhas simples e de todos os
              tamanhos.
            </p>
          </div>
        </div>
      </section>

      <section className="nos-service">
        <div className="container">
          <header className="nos-service-head">
            <p className="eyebrow">O encontro</p>
            <h2>Casa do Lago</h2>
          </header>
          <div className="nos-service-grid">
            <article>
              <span className="nos-service-label">Quando</span>
              <time dateTime="2027-01-31T16:00:00-03:00">
                31 de janeiro de 2027
                <small>Domingo · 16h</small>
              </time>
            </article>
            <article>
              <span className="nos-service-label">Onde</span>
              <p>
                Casa do Lago
                <small>Costazul · Rio das Ostras — RJ</small>
              </p>
            </article>
            <article>
              <span className="nos-service-label">Endereço</span>
              <address>
                R. Beija-flor · Costazul
                <small>Rio das Ostras — RJ · 28895-048</small>
              </address>
            </article>
          </div>
          <a
            className="btn nos-map-link"
            href={MAP_URL}
            target="_blank"
            rel="noreferrer"
          >
            Abrir rota no mapa
          </a>
        </div>
      </section>

      <section className="nos-next">
        <div className="container nos-next-grid">
          <div>
            <p className="eyebrow">Antes do grande dia</p>
            <h2>Dois caminhos, no seu tempo.</h2>
          </div>
          <Link href="/confirmar" className="nos-next-card">
            <span>01</span>
            <div>
              <h3>Confirme sua presença</h3>
              <p>Leva menos de dois minutos e ajuda a preparar cada detalhe.</p>
            </div>
            <i aria-hidden="true">→</i>
          </Link>
          <Link href="/presentes" className="nos-next-card">
            <span>02</span>
            <div>
              <h3>Conheça nossa lista</h3>
              <p>Presentes inteiros, cotas e contribuições de qualquer valor.</p>
            </div>
            <i aria-hidden="true">→</i>
          </Link>
        </div>
      </section>
    </main>
  );
}
