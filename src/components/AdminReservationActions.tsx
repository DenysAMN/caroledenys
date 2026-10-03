"use client";

import Link from "next/link";
import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { manageReservation } from "@/app/admin/actions/reservations";
import { reservationActions, type ReservationAction } from "@/lib/admin-management-rules";

const labels: Record<ReservationAction, string> = { CANCEL: "Cancelar reserva", RECEIVE: "Marcar como recebido", REOPEN: "Desfazer recebimento" };

export default function AdminReservationActions({ id, type, status, enabled }: { id: string; type: string; status: string; enabled: boolean }) {
  const router = useRouter();
  const reasonId = useId();
  const [action, setAction] = useState<ReservationAction | null>(null);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const actions = reservationActions(type, status);

  return <div className="admin-reservation-actions">
    <div className="admin-inline-actions">
      {actions.map(value => <button type="button" key={value} className={`btn btn-ghost${value === "CANCEL" ? " admin-btn-danger" : ""}`} disabled={pending || !enabled} onClick={() => { setAction(value); setReason(""); setMessage(""); }}>{labels[value]}</button>)}
      {enabled && <Link className="text-link" href={`/admin/historico?entity=${id}`}>Histórico</Link>}
    </div>
    {status === "PAGO" && <p className="reservation-privacy">Pagamento confirmado. Cancelamento e estorno não são realizados por esta tela.</p>}
    {action && <form className="admin-inline-form" onSubmit={event => {
      event.preventDefault();
      startTransition(async () => {
        try {
          const result = await manageReservation(id, action, reason);
          setMessage(result.message);
          if (result.ok) { setAction(null); router.refresh(); }
        } catch { setMessage("Não foi possível salvar. Atualize a página e tente novamente."); }
      });
    }}>
      <p>{action === "CANCEL" ? "Confirme o cancelamento. O presente ou as cotas serão liberados; esta reserva continuará no histórico." : action === "REOPEN" ? "O presente voltará a estar reservado para este convidado." : "Confirme que o presente foi recebido pelo casal."}</p>
      <label htmlFor={reasonId}>Motivo ou observação</label>
      <textarea id={reasonId} value={reason} onChange={event => setReason(event.target.value)} minLength={3} maxLength={300} required disabled={pending} rows={2} />
      <div className="admin-inline-actions"><button className="btn" disabled={pending}>{pending ? "Salvando…" : "Confirmar ação"}</button><button type="button" className="btn btn-ghost" disabled={pending} onClick={() => setAction(null)}>Voltar</button></div>
    </form>}
    {message && <p role="status" className="admin-action-message">{message}</p>}
  </div>;
}
