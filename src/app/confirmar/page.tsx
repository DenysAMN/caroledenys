import type { Metadata } from "next";
import Link from "next/link";
import RsvpForm from "@/components/RsvpForm";

export const metadata: Metadata = {
  title: "Confirmar presença · Carol & Denys",
  description: "Confirme sua presença no casamento de Carol e Denys.",
};

export default function ConfirmarPage() {
  return (
    <main className="rsvp-page">
      <div className="container rsvp-layout">
        <aside className="rsvp-intro">
          <p className="eyebrow">Presença</p>
          <hr className="rule" />
          <h1>Um lugar à mesa espera por você.</h1>
          <p>
            Conte pra gente se poderá viver esse domingo conosco. Sua resposta
            ajuda a preparar cada detalhe da Casa do Lago.
          </p>
          <dl>
            <div>
              <dt>Quando</dt>
              <dd>31.01.2027 · 16h</dd>
            </div>
            <div>
              <dt>Onde</dt>
              <dd>Casa do Lago · Costazul</dd>
            </div>
          </dl>
          <p className="rsvp-not-gate">
            A confirmação é um convite, nunca uma condição para{" "}
            <Link href="/presentes">presentear</Link>.
          </p>
        </aside>
        <RsvpForm />
      </div>
    </main>
  );
}
