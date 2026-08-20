import Image from "next/image";

import { WEDDING_INSPIRATION } from "../content/wedding-photos";

export default function WeddingInspiration() {
  return (
    <section className="wedding-inspiration" aria-labelledby="wedding-inspiration-title">
      <div className="container wedding-inspiration-grid">
        <header className="wedding-inspiration-copy">
          <p className="eyebrow">Cores e atmosfera</p>
          <h2 id="wedding-inspiration-title">Nossa inspiração</h2>
          <p>
            Flores em tons profundos, folhagens e mesas iluminadas por velas —
            pequenos detalhes da atmosfera que imaginamos para celebrar.
          </p>
          <span>Vinho · ameixa · verde profundo</span>
        </header>

        <div className="wedding-inspiration-photos">
          {WEDDING_INSPIRATION.map((photo) => (
            <figure key={photo.src}>
              <Image
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                sizes="(max-width: 700px) 46vw, 20vw"
              />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
