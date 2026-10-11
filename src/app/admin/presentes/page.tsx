import Link from "next/link";
import AdminGiftCatalog from "@/components/AdminGiftCatalog";
import { getAdminGifts } from "@/lib/admin-gifts";
export const dynamic = "force-dynamic";
export default async function AdminGiftsPage() {
  const gifts = await getAdminGifts();
  // Only display fields enter the authenticated client UI; no private phone/token data.
  const catalog = gifts.map(gift => ({ id:gift.id,title:gift.title,image_url:gift.image_url,type:gift.type,status:gift.status,category:gift.category,sort_order:gift.sort_order,
    price_cents:gift.price_cents,min_cents:gift.min_cents,shares_taken:gift.shares_taken,total_shares:gift.total_shares,reservedBy:gift.reservedBy,
    paidShares:gift.paidShares,hasReceived:gift.hasReceived,hasReservations:gift.hasReservations,hasPending:gift.hasPending }));
  return <main className="admin-page">
    <header className="admin-page-head"><div><p className="eyebrow">Catálogo</p><h1>Presentes</h1><p>Toque na situação para encontrar o que precisa.</p></div><Link href="/admin/presentes/novo" className="btn">Novo presente</Link></header>
    <AdminGiftCatalog gifts={catalog} />
  </main>;
}
