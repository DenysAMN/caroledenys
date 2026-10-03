import AdminManagementNotice from "@/components/AdminManagementNotice";
import AdminReservationActions from "@/components/AdminReservationActions";
import { adminManagementReady } from "@/lib/admin-management";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdminGiftDeleteButton from "@/components/AdminGiftDeleteButton";
import AdminGiftForm from "@/components/AdminGiftForm";
import { whatsappUrl } from "@/lib/reservation-whatsapp";
import { formatBRL } from "@/lib/format";
import { getAdminGift, getGiftReservations } from "@/lib/admin-gifts";

export default async function EditGiftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gift = await getAdminGift(id);
  if (!gift) notFound();
  const [reservations, ready] = await Promise.all([getGiftReservations(id), adminManagementReady()]);

  return (
    <main className="admin-page admin-form-page">
      <Link href="/admin/presentes" className="back-link">← Voltar aos presentes</Link>
      <header className="admin-page-head"><div><p className="eyebrow">Edição</p><h1>{gift.title}</h1></div></header>
      {!ready && <AdminManagementNotice />}
      <p><Link className="text-link" href="/admin/reservas">Ver todas as reservas →</Link></p>
      <section className="admin-reservations" aria-label="Quem reservou este presente">
        <h2>Quem reservou</h2>
        {reservations.length === 0 ? <p>Nenhuma reserva registrada.</p> : reservations.map((reservation) => {
          const contact = reservation.phone ? whatsappUrl(reservation.phone, `Olá, ${reservation.name}! Sobre sua reserva de ${gift.title} para o casamento de Carol e Denys: https://caroledenys.vercel.app/presentes/${gift.id}`) : null;
          return <article key={reservation.id}>
            <h3>{reservation.name}</h3>
            <p>{reservation.phone || "Telefone não informado"}</p>
            <p>Status: {reservation.status.replaceAll("_", " ").toLowerCase()}{reservation.shares ? ` · ${reservation.shares} cota(s)` : ""}{reservation.amountCents != null ? ` · ${formatBRL(reservation.amountCents)}` : ""}</p>
            {contact && <a className="text-link" href={contact} target="_blank" rel="noopener noreferrer">Contatar pelo WhatsApp ↗</a>}
            <AdminReservationActions id={reservation.id} type={gift.type} status={reservation.status} enabled={ready} />
          </article>;
        })}
      </section>
      <AdminGiftForm gift={gift} />
      <section className="admin-danger-zone">
        <h2>Excluir presente</h2>
        <p>Presentes com reservas não podem ser excluídos. Use “Oculto” para tirá-los do site e preservar o histórico.</p>
        <AdminGiftDeleteButton giftId={gift.id} />
      </section>
    </main>
  );
}
