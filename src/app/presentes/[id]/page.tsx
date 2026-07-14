import Link from "next/link";
import { notFound } from "next/navigation";
import { getGift } from "@/lib/gifts";
import { formatBRL, formatBRLShort } from "@/lib/format";
import GiftThumb from "@/components/GiftThumb";
import LinkReserveButton from "@/components/LinkReserveButton";
import CotasReserveSection from "@/components/CotasReserveSection";
import LivreReserveSection from "@/components/LivreReserveSection";

export const revalidate = 30;

// Next 16: `params` é assíncrono (Promise) — precisa de await.
export default async function GiftDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const gift = await getGift(id);
  if (!gift) notFound();

  const done = gift.status === "CONCLUIDO";
  const taken = gift.shares_taken ?? 0;
  const totalShares = gift.total_shares ?? 0;
  const remaining = Math.max(0, totalShares - taken);
  const pct = totalShares > 0 ? Math.round((taken / totalShares) * 100) : 0;

  const kind = gift.type === "COTAS" ? "Cotas" : gift.type === "LIVRE" ? "Livre" : "Presente";

  return (
    <main>
      <div className="container detail">
        <div className="detail-media">
          <GiftThumb />
        </div>

        <div>
          <Link href="/presentes" className="back-link">
            ← Voltar à lista
          </Link>

          <p className="gift-kicker" style={{ marginTop: 18 }}>
            {[kind, gift.category].filter(Boolean).join(" · ")}
          </p>
          <h1>{gift.title}</h1>
          {gift.description && <p className="desc">{gift.description}</p>}

          {/* ---------- COTAS ---------- */}
          {gift.type === "COTAS" && (
            <div style={{ marginTop: 26 }}>
              <div className="bar">
                <i style={{ width: `${pct}%` }} />
              </div>
              <div className="prog-meta">
                <span>
                  {taken} de {totalShares} cotas
                </span>
                <span>
                  {formatBRLShort(taken * (gift.share_cents ?? 0))}
                  {gift.total_cents != null ? ` de ${formatBRLShort(gift.total_cents)}` : ""}
                </span>
              </div>

              {done ? (
                <p className="gift-price" style={{ marginTop: 24, color: "var(--marsala)" }}>
                  Presenteado ♥ obrigado!
                </p>
              ) : gift.share_cents != null ? (
                <CotasReserveSection
                  giftId={gift.id}
                  giftTitle={gift.title}
                  shareCents={gift.share_cents}
                  remaining={remaining}
                />
              ) : null}
            </div>
          )}

          {/* ---------- LINK ---------- */}
          {gift.type === "LINK" && (
            <div style={{ marginTop: 26 }}>
              {gift.price_cents != null && (
                <p className="gift-price" style={{ fontSize: 34 }}>
                  {formatBRL(gift.price_cents)}
                </p>
              )}
              {gift.external_url && (
                <p style={{ marginTop: 14 }}>
                  <a
                    href={gift.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="back-link"
                  >
                    Ver o presente na loja ↗
                  </a>
                </p>
              )}
              <div style={{ marginTop: 30 }}>
                <LinkReserveButton
                  giftId={gift.id}
                  giftTitle={gift.title}
                  externalUrl={gift.external_url}
                  status={gift.status}
                />
              </div>
            </div>
          )}

          {/* ---------- LIVRE ---------- */}
          {gift.type === "LIVRE" && (
            <LivreReserveSection
              giftId={gift.id}
              giftTitle={gift.title}
              minCents={gift.min_cents ?? 2000}
            />
          )}
        </div>
      </div>
    </main>
  );
}
