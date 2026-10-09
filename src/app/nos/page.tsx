import LakeMark from "@/components/LakeMark";
import { getPublicGallery } from "@/lib/gallery";
import { gallerySelection } from "@/lib/gallery-rules";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import DressCode from "@/components/DressCode";
import VenueMap from "@/components/VenueMap";
import CoupleStorySection from "@/components/CoupleStorySection";

export const metadata: Metadata = {
  title: "Nós",
  description:
    "Conheça a celebração de Carol e Denys e veja os detalhes da Casa do Lago.",
};

export const revalidate = 30;

export default async function NosPage() {
  const photos = gallerySelection(await getPublicGallery());
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
            {photos.cover ? <Image
              src={photos.cover.src}
              alt={photos.cover.alt}
              fill
              priority
              sizes="(max-width: 900px) 92vw, 46vw"
            /> : <LakeMark />}
            <span>{photos.cover?.caption || "Rio das Ostras · verão de 2027"}</span>
          </div>
        </div>
      </section>

      <CoupleStorySection photo={photos.story} />

      <section className="nos-service">
        <div className="container">
          <header className="nos-service-head">
            <p className="eyebrow">O encontro</p>
            <h2>Casa do Lago</h2>
          </header>
          <div className="nos-service-grid">
            <article>
              <span className="nos-service-label">Quando</span>
              <time dateTime="2027-01-31T15:30:00-03:00">
                31 de janeiro de 2027
                <small>Domingo · 15h30</small>
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
                Rua Beija-flor · Bairro Costazul
                <small>Rio das Ostras — RJ · CEP 28895-048</small>
              </address>
            </article>
          </div>
          <VenueMap />
        </div>
      </section>

      <DressCode />

      <section className="nos-next">
        <div className="container nos-next-grid">
          <div>
            <p className="eyebrow">Antes do grande dia</p>
            <h2>Dois caminhos, no seu tempo.</h2>
          </div>
          <Link href="/recados" className="nos-next-card">
            <span>01</span>
            <div>
              <h3>Leia nossos recados</h3>
              <p>Palavras carinhosas de quem já está celebrando com a gente.</p>
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
