import Image from "next/image";

import {
  COUPLE_MILESTONES,
  COUPLE_STORIES,
} from "../content/couple-story";

type CoupleStorySectionProps = {
  id?: string;
};

export default function CoupleStorySection({
  id,
}: CoupleStorySectionProps) {
  return (
    <section
      id={id}
      className="couple-story"
      aria-labelledby="couple-story-title"
    >
      <span className="couple-story-year" aria-hidden="true">
        2025
      </span>
      <div className="container">
        <header className="couple-story-intro">
          <p className="eyebrow">Nossa história</p>
          <h2 id="couple-story-title">A mesma história, dois olhares.</h2>
          <p>
            Antes do nosso sim, vieram uma mensagem, alguns stories e duas
            versões de um encontro que mudou tudo.
          </p>
        </header>

        <figure className="couple-story-photo">
          <Image
            src="/images/ensaio/principal-3.jpg"
            alt="Carol sorrindo para Denys durante o ensaio"
            width={1365}
            height={2048}
            sizes="(max-width: 700px) 92vw, 38vw"
          />
          <figcaption>Dois olhares. A mesma escolha.</figcaption>
        </figure>

        <ol
          className="couple-timeline"
          aria-label="Linha do tempo do relacionamento"
        >
          {COUPLE_MILESTONES.map((milestone) => (
            <li key={milestone.dateTime}>
              <time dateTime={milestone.dateTime}>{milestone.dateLabel}</time>
              <span>{milestone.label}</span>
            </li>
          ))}
        </ol>

        <div className="couple-letters">
          {COUPLE_STORIES.map((story, index) => (
            <article
              key={story.id}
              className={`couple-letter couple-letter-${story.id}`}
            >
              <span className="couple-letter-quote" aria-hidden="true">
                “
              </span>
              <header className="couple-letter-header">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{story.perspective}</h3>
              </header>

              <div className="couple-letter-body">
                {story.sections.map((storySection) => (
                  <section
                    key={storySection.heading ?? storySection.paragraphs[0]}
                  >
                    {storySection.heading && (
                      <h4>{storySection.heading}</h4>
                    )}
                    {storySection.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </section>
                ))}
              </div>

              <footer className="couple-letter-signature">
                <span>Com amor,</span>
                <strong>{story.author}</strong>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
