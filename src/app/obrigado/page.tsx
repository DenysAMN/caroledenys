import Link from "next/link";

export const metadata = {
  title: "Obrigado",
};

export default function ObrigadoPage() {
  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 560, textAlign: "center" }}>
        <p className="eyebrow">Comprovante recebido</p>
        <hr className="rule" />
        <h1 style={{ fontSize: "clamp(42px, 10vw, 64px)" }}>Muito obrigado! ♥</h1>
        <p style={{ color: "var(--muted)", margin: "16px auto 0", maxWidth: 440 }}>
          Vamos conferir o PIX e confirmar o presente. Seu carinho já deixou esse dia
          ainda mais especial para nós.
        </p>

        <div className="hero-cta" style={{ marginTop: 34 }}>
          <Link href="/recados" className="btn">
            Ver recados
          </Link>
          <Link href="/presentes" className="btn btn-ghost">
            Voltar aos presentes
          </Link>
        </div>
      </div>
    </main>
  );
}
