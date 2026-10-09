import Link from "next/link";
import Image from "next/image";

import { WEDDING_GALLERY, type WeddingPhoto } from "../content/wedding-photos";

export default function WeddingGallery({ photos = WEDDING_GALLERY, total = photos.length, showFullLink = false }: { photos?: readonly (WeddingPhoto & { caption?: string })[]; total?: number; showFullLink?: boolean }) {
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
          {photos.map((photo) => (
            <figure
              key={photo.src}
              className={`wedding-gallery-item is-${photo.orientation}${photo.playful ? " is-playful" : ""}`}
            >
              <a href={photo.src} target="_blank" rel="noopener noreferrer" aria-label={`Abrir foto: ${photo.alt}`}>
              <Image
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                sizes={photo.orientation === "landscape" ? "(max-width: 700px) 100vw, 66vw" : "(max-width: 700px) 100vw, 34vw"}
              />
              </a>
              {(photo.caption || photo.playful) && <figcaption>{photo.caption || "Essa também somos nós."}</figcaption>}
            </figure>
          ))}
        </div>
        {photos.length === 0 && <p>{total > 0 ? "Veja todos os momentos na galeria completa." : "As fotos deste álbum serão publicadas aqui."}</p>}
        {showFullLink && total > 0 && <div className="home-gifts-action"><Link className="btn" href="/galeria">Ver galeria completa ({total} fotos)</Link></div>}
      </div>
    </section>
  );
}
