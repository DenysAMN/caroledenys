import Image from "next/image";

import { WEDDING_INSPIRATION, type WeddingPhoto } from "../content/wedding-photos";

export default function WeddingInspiration({ photos = WEDDING_INSPIRATION }: { photos?: readonly (WeddingPhoto & { caption?: string })[] }) {
  return (
    <section id="inspiracao" className="wedding-inspiration home-anchor-section" aria-labelledby="wedding-inspiration-title">
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
          {photos.map((photo) => (
            <figure key={photo.src}>
              <Image
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                sizes="(max-width: 700px) 46vw, 20vw"
              />
              {photo.caption && <figcaption>{photo.caption}</figcaption>}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
