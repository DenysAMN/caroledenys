import { reservationMessage, whatsappUrl } from "@/lib/reservation-whatsapp";

export default function ReservationWhatsApp(props: {
  name: string;
  phone: string;
  couplePhone?: string | null;
  giftTitle: string;
  giftId: string;
  claimId?: string;
  expiresAt?: string | null;
}) {
  const message = reservationMessage(props);
  const selfLink = whatsappUrl(props.phone, message);
  const coupleLink = props.couplePhone ? whatsappUrl(props.couplePhone, `${message}\nContato do convidado: ${props.phone}`) : null;
  return (
    <div className="reservation-whatsapp">
      <p>Reserva em nome de <strong>{props.name}</strong>.</p>
      <p>Guarde o link da sua reserva. Os botões abrem uma mensagem pronta; toque em <strong>Enviar</strong> no WhatsApp. Não há envio automático.</p>
      <div className="reservation-whatsapp-actions">
        {selfLink && <a className="btn btn-ghost" href={selfLink} target="_blank" rel="noopener noreferrer">Guardar no meu WhatsApp</a>}
        {coupleLink && <a className="btn btn-ghost" href={coupleLink} target="_blank" rel="noopener noreferrer">Avisar Denys pelo WhatsApp</a>}
      </div>
    </div>
  );
}
