import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Confirmar presença · Carol & Denys",
};

export default function ConfirmarPage() {
  return (
    <main className="section">
      <div className="container" style={{ textAlign: "center", maxWidth: 560 }}>
        <p className="eyebrow">Presença</p>
        <hr className="rule" />
        <h2 style={{ fontSize: 40 }}>Confirmação em breve</h2>
        <p style={{ color: "var(--muted)", marginTop: 12 }}>
          Estamos preparando a confirmação de presença. Volte logo — e não se
          preocupe, confirmar presença nunca é pré-requisito para presentear.
        </p>
        <div style={{ marginTop: 30 }}>
          <Link href="/presentes" className="btn">
            Ver a lista de presentes
          </Link>
        </div>
      </div>
    </main>
  );
}
