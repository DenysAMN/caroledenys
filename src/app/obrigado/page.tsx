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
          <Link href="/confirmar" className="btn">
            Confirmar presença
          </Link>
          <Link href="/presentes" className="btn btn-ghost">
            Voltar aos presentes
          </Link>
        </div>

        <p className="note-soft" style={{ margin: "34px auto 0", textAlign: "left" }}>
          A confirmação de presença é um convite, não uma obrigação para presentear.
          Se ainda não souber se poderá ir, tudo bem deixar para depois.
        </p>
      </div>
    </main>
  );
}
