import Image from "next/image";
import Link from "next/link";
import { getAdminGifts } from "@/lib/admin-gifts";
import { formatBRLShort } from "@/lib/format";

export const dynamic = "force-dynamic";

function price(gift: Awaited<ReturnType<typeof getAdminGifts>>[number]) {
  if (gift.type === "LINK") return gift.price_cents ? formatBRLShort(gift.price_cents) : "Sem preço";
  if (gift.type === "COTAS") return `${gift.shares_taken}/${gift.total_shares ?? 0} cotas`;
  return `Mín. ${formatBRLShort(gift.min_cents ?? 2000)}`;
}

export default async function AdminGiftsPage() {
  const gifts = await getAdminGifts();

  return (
    <main className="admin-page">
      <header className="admin-page-head">
        <div><p className="eyebrow">Catálogo</p><h1>Presentes</h1></div>
        <Link href="/admin/presentes/novo" className="btn">Novo presente</Link>
      </header>
      <div className="admin-gift-list">
        {gifts.map((gift) => (
          <Link href={`/admin/presentes/${gift.id}`} className="admin-gift-row" key={gift.id}>
            <span className="admin-gift-order">{String(gift.sort_order).padStart(2, "0")}</span>
            <div className="admin-gift-miniature">
              {gift.image_url ? <Image src={gift.image_url} alt="" fill sizes="76px" /> : <span>C&amp;D</span>}
            </div>
            <div className="admin-gift-name"><small>{gift.type} · {gift.category || "Sem categoria"}</small><strong>{gift.title}</strong></div>
            <span className={`admin-status admin-status-${gift.status.toLowerCase()}`}>{gift.status}</span>
            <span className="admin-gift-price">{price(gift)}</span>
            <span className="admin-gift-edit">Editar →</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
