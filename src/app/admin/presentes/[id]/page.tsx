import Link from "next/link";
import { notFound } from "next/navigation";
import AdminGiftDeleteButton from "@/components/AdminGiftDeleteButton";
import AdminGiftForm from "@/components/AdminGiftForm";
import { getAdminGift } from "@/lib/admin-gifts";

export default async function EditGiftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gift = await getAdminGift(id);
  if (!gift) notFound();

  return (
    <main className="admin-page admin-form-page">
      <Link href="/admin/presentes" className="back-link">← Voltar aos presentes</Link>
      <header className="admin-page-head"><div><p className="eyebrow">Edição</p><h1>{gift.title}</h1></div></header>
      <AdminGiftForm gift={gift} />
      <section className="admin-danger-zone">
        <h2>Excluir presente</h2>
        <p>A exclusão também apaga as reservas ligadas a ele. Use “Oculto” quando quiser apenas tirá-lo do site.</p>
        <AdminGiftDeleteButton giftId={gift.id} />
      </section>
    </main>
  );
}
