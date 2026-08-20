import Image from "next/image";

import { WEDDING_GALLERY } from "../content/wedding-photos";

export default function WeddingGallery() {
  return (
    <section id="galeria" className="wedding-gallery home-anchor-section" aria-labelledby="wedding-gallery-title">
      <div className="container">
        <header className="wedding-gallery-head">
          <div>
            <p className="eyebrow">Nosso ensaio</p>
            <h2 id="wedding-gallery-title">Um pouco de nós, antes do sim.</h2>
          </div>
          <p>
            Entre passos, risadas e tentativas de dançar, guardamos uma tarde
            que já faz parte da nossa história.
          </p>
        </header>

        <div className="wedding-gallery-grid">
          {WEDDING_GALLERY.map((photo) => (
            <figure
              key={photo.src}
              className={`wedding-gallery-item is-${photo.orientation}${photo.playful ? " is-playful" : ""}`}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                sizes={photo.orientation === "landscape" ? "(max-width: 700px) 100vw, 66vw" : "(max-width: 700px) 100vw, 34vw"}
              />
              {photo.playful && <figcaption>Essa também somos nós.</figcaption>}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
