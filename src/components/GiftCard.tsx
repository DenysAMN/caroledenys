import Image from "next/image";
import Link from "next/link";
import type { Gift } from "@/lib/types";
import { formatBRLShort } from "@/lib/format";
import GiftThumb from "@/components/GiftThumb";

const TYPE_LABEL: Record<Gift["type"], string> = {
  LINK: "Presente",
  COTAS: "Cotas",
  LIVRE: "Livre",
};

export default function GiftCard({ gift }: { gift: Gift }) {
  const done = gift.status === "CONCLUIDO";
  const kicker = [TYPE_LABEL[gift.type], gift.category].filter(Boolean).join(" · ");

  return (
    <Link href={`/presentes/${gift.id}`} className="gift-card">
      <div className="gift-thumb">
        <span className="badge">{TYPE_LABEL[gift.type]}</span>
        {gift.image_url ? (
          <Image
            src={gift.image_url}
            alt={gift.title}
            fill
            sizes="(max-width: 600px) 100vw, 33vw"
            className="gift-thumb-image"
          />
        ) : (
          <GiftThumb />
        )}
        {done && <div className="done">Presenteado ♥</div>}
      </div>
      <div className="gift-body">
        <span className="gift-kicker">{kicker}</span>
        <h3 className="gift-title">{gift.title}</h3>

        <div className="gift-foot">
          {gift.type === "COTAS" && <CotasFoot gift={gift} />}
          {gift.type === "LINK" && (
            <span className="gift-price">
              {gift.price_cents != null ? formatBRLShort(gift.price_cents) : "Ver presente"}
            </span>
          )}
          {gift.type === "LIVRE" && (
            <span className="gift-price">Qualquer valor</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function CotasFoot({ gift }: { gift: Gift }) {
  const total = gift.total_shares ?? 0;
  const taken = gift.shares_taken ?? 0;
  const pct = total > 0 ? Math.round((taken / total) * 100) : 0;
  const raised = taken * (gift.share_cents ?? 0);

  return (
    <>
      <div className="bar">
        <i style={{ width: `${pct}%` }} />
      </div>
      <div className="prog-meta">
        <span>
          {taken} de {total} cotas
        </span>
        <span>
          {formatBRLShort(raised)}
          {gift.total_cents != null ? ` de ${formatBRLShort(gift.total_cents)}` : ""}
        </span>
      </div>
    </>
  );
}
