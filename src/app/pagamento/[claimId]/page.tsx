import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { getClaimForPayment } from "@/lib/claims";
import { gerarPixBRCode } from "@/lib/pix";
import { formatBRL } from "@/lib/format";
import PixCopyButton from "@/components/PixCopyButton";
import PaymentCountdown from "@/components/PaymentCountdown";
import ReceiptUploadForm from "@/components/ReceiptUploadForm";
import { isClaimPayable } from "@/lib/receipt-validation";

// Sempre fresco: status e cronômetro mudam. Nunca cachear.
export const dynamic = "force-dynamic";

export default async function PagamentoPage({
  params,
}: {
  params: Promise<{ claimId: string }>;
}) {
  const { claimId } = await params;
  const claim = await getClaimForPayment(claimId);
  if (!claim) notFound();

  const isCotas = claim.shares != null;

  // Já enviado / confirmado
  if (claim.status === "EM_ANALISE") {
    return (
      <StatusScreen
        eyebrow="Recebido"
        title="Estamos conferindo ❤️"
        text="Recebemos seu comprovante. Os noivos vão conferir o PIX; acompanhe a confirmação por este link."
      />
    );
  }
  if (claim.status === "PAGO") {
    return (
      <StatusScreen
        eyebrow="Pagamento confirmado"
        title="Presente confirmado! ♥"
        text="O PIX já foi conferido. Muito obrigado pelo carinho com a gente."
      />
    );
  }
  if (claim.status === "EXPIRADO" || claim.status === "CANCELADO") {
    return (
      <StatusScreen
        eyebrow="Reserva expirada"
        title="A reserva expirou"
        text="Sem problema — volte à lista e reserve de novo, com calma."
      />
    );
  }
  if (claim.status !== "AGUARDANDO_PAGAMENTO") notFound();
  if (!isClaimPayable(claim.status, claim.expires_at)) {
    return (
      <StatusScreen
        eyebrow="Reserva expirada"
        title="A reserva expirou"
        text="Não faça o PIX deste código. Volte à lista e reserve de novo para gerar um pagamento válido."
      />
    );
  }

  const brCode = gerarPixBRCode({ amountCents: claim.amount_cents, txid: claim.txid });
  const qrDataUrl = await QRCode.toDataURL(brCode, { margin: 1, width: 280 });

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 520, textAlign: "center" }}>
        <p className="eyebrow">Pagamento por PIX</p>
        <h2 style={{ fontSize: 34, marginTop: 8 }}>{claim.gift_title}</h2>
        <p style={{ color: "var(--muted)", marginTop: 4 }}>
          {isCotas ? `${claim.shares} ${claim.shares === 1 ? "cota" : "cotas"}` : "Presente livre"}
        </p>
        <p className="gift-price" style={{ fontSize: 44, margin: "14px 0 6px" }}>
          {formatBRL(claim.amount_cents)}
        </p>

        {isCotas && claim.expires_at && <PaymentCountdown expiresAt={claim.expires_at} />}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          alt="QR Code para pagamento PIX"
          width={280}
          height={280}
          style={{ margin: "22px auto", borderRadius: 8, border: "1px solid var(--sand)" }}
        />

        <div style={{ maxWidth: 360, margin: "0 auto" }}>
          <PixCopyButton code={brCode} />
        </div>

        <p className="note-soft" style={{ marginTop: 22, textAlign: "left" }}>
          Abra o app do seu banco → <strong>PIX → Pix Copia e Cola</strong> (ou leia o QR
          Code). O valor já vem preenchido. Depois de pagar, envie o comprovante abaixo.
        </p>

        <ReceiptUploadForm claimId={claim.id} />

        <p style={{ marginTop: 22 }}>
          <Link href="/presentes" className="back-link">
            ← Voltar à lista
          </Link>
        </p>
      </div>
    </main>
  );
}

function StatusScreen({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 520, textAlign: "center" }}>
        <p className="eyebrow">{eyebrow}</p>
        <hr className="rule" />
        <h2 style={{ fontSize: 38 }}>{title}</h2>
        <p style={{ color: "var(--muted)", marginTop: 12 }}>{text}</p>
        <div style={{ marginTop: 28 }}>
          <Link href="/presentes" className="btn btn-ghost">
            Voltar à lista
          </Link>
        </div>
      </div>
    </main>
  );
}
