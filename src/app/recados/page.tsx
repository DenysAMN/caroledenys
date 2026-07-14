import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Recados · Carol & Denys",
};

export default function RecadosPage() {
  return (
    <main className="section">
      <div className="container" style={{ textAlign: "center", maxWidth: 560 }}>
        <p className="eyebrow">Mural</p>
        <hr className="rule" />
        <h2 style={{ fontSize: 40 }}>Recados em breve</h2>
        <p style={{ color: "var(--muted)", marginTop: 12 }}>
          Aqui vão aparecer os recadinhos de quem confirmou presença e presenteou.
          Ainda estamos montando este cantinho. 💛
        </p>
        <div style={{ marginTop: 30 }}>
          <Link href="/" className="btn btn-ghost">
            Voltar ao início
          </Link>
        </div>
      </div>
    </main>
  );
}
