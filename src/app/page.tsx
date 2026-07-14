import Link from "next/link";
import Countdown from "@/components/Countdown";
import GiftCard from "@/components/GiftCard";
import { getGifts } from "@/lib/gifts";

// Revalida a cada 30s para a prévia de presentes acompanhar o banco.
export const revalidate = 30;

export default async function Home() {
  const gifts = await getGifts();
  const preview = gifts.slice(0, 3);

  return (
    <main>
      <section className="hero">
        <div className="container">
          <p className="eyebrow">Vamos casar</p>
          <hr className="rule" />
          <h1 className="names">
            Carol
            <span className="amp">&amp;</span>
            Denys
          </h1>
          <p className="date">31 · Janeiro · 2027</p>
          <p className="place">
            Casa do Lago
            <small>Costazul · Rio das Ostras — RJ</small>
          </p>

          <Countdown />

          <div className="hero-cta">
            <Link href="/presentes" className="btn">
              Lista de presentes
            </Link>
            <Link href="/confirmar" className="btn btn-ghost">
              Confirmar presença
            </Link>
          </div>

          <svg
            className="lake"
            viewBox="0 0 720 150"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <ellipse cx="560" cy="44" rx="18" ry="18" fill="#C0A050" opacity=".45" />
            <path d="M0 92 C120 70 220 80 320 86 C440 93 560 66 720 84 L720 150 L0 150 Z" fill="#EFE6D6" />
            <path d="M0 116 C150 104 260 122 380 114 C520 105 620 122 720 112 L720 150 L0 150 Z" fill="#E3D6BE" />
          </svg>
        </div>
      </section>

      {preview.length > 0 && (
        <section className="section" style={{ paddingTop: 24 }}>
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
            <div style={{ textAlign: "center", marginTop: 40 }}>
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
