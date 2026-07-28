import AdminPaymentActions from "@/components/AdminPaymentActions";
import { formatBRL } from "@/lib/format";
import type { PendingPayment } from "@/lib/admin-payments";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export default function AdminQueue({ payments }: { payments: PendingPayment[] }) {
  if (payments.length === 0) {
    return (
      <div className="admin-empty">
        <span>✓</span>
        <h2>Nada para conferir</h2>
        <p>Os próximos comprovantes enviados aparecerão aqui.</p>
      </div>
    );
  }

  return (
    <div className="admin-queue">
      {payments.map((payment, index) => (
        <article className="admin-payment" key={payment.id}>
          <div className="admin-payment-index">
            {String(index + 1).padStart(2, "0")}
          </div>
          <div className="admin-receipt-frame">
            {payment.receiptUrl ? (
              <iframe
                src={payment.receiptUrl}
                title={`Comprovante de ${payment.payerName}`}
                loading="lazy"
              />
            ) : (
              <p>Comprovante indisponível.</p>
            )}
            {payment.receiptUrl && (
              <a href={payment.receiptUrl} target="_blank" rel="noreferrer">
                Abrir em nova aba ↗
              </a>
            )}
          </div>
          <div className="admin-payment-copy">
            <p className="eyebrow">{payment.giftType === "COTAS" ? "Cotas" : "Livre"}</p>
            <h2>{payment.giftTitle}</h2>
            <div className="admin-payment-value">{formatBRL(payment.amountCents)}</div>
            <dl className="admin-ledger-details">
              <div><dt>Convidado</dt><dd>{payment.guestName}</dd></div>
              <div><dt>Nome no PIX</dt><dd>{payment.payerName}</dd></div>
              <div><dt>TXID</dt><dd>{payment.txid}</dd></div>
              <div><dt>Enviado</dt><dd>{dateFormatter.format(new Date(payment.createdAt))}</dd></div>
            </dl>
            <AdminPaymentActions claimId={payment.id} />
          </div>
        </article>
      ))}
    </div>
  );
}
