import Link from "next/link";
import AdminManagementNotice from "@/components/AdminManagementNotice";
import { requireAdmin } from "@/lib/admin-auth";
import { adminManagementReady } from "@/lib/admin-management";
import { isUuid } from "@/lib/guest-area-rules";
import { createAdminClient } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
const labels: Record<string, string> = { CANCEL: "Reserva cancelada", RECEIVE: "Recebimento confirmado", REOPEN: "Recebimento desfeito", EDIT_CLAIM_MESSAGE: "Recado de presente editado", EDIT_RSVP_MESSAGE: "Recado histórico editado" };
const dates = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

export default async function AdminHistoryPage({ searchParams }: { searchParams: Promise<{ entity?: string }> }) {
  const actor = await requireAdmin();
  const [ready, params] = await Promise.all([adminManagementReady(), searchParams]);
  if (!ready) return <main className="admin-page"><h1>Histórico administrativo</h1><AdminManagementNotice /></main>;
  const entity = isUuid(params.entity) ? params.entity : null;
  let query = createAdminClient().from("admin_activity").select("id, action, entity_id, actor_id, reason, before_data, after_data, created_at").order("created_at", { ascending: false }).limit(100);
  if (entity) query = query.eq("entity_id", entity);
  const { data, error } = await query;
  if (error) throw new Error("Não foi possível carregar o histórico.");
  return <main className="admin-page">
    <header className="admin-page-head"><div><p className="eyebrow">Registro de alterações</p><h1>Histórico administrativo</h1></div><p>Até 100 alterações mais recentes. Versões anteriores de recados e motivos das ações ficam somente nesta área.</p></header>
    {entity && <p><Link href="/admin/historico">Ver todas as alterações</Link></p>}
    <section className="admin-reservations" aria-label="Alterações registradas">
      {(data ?? []).map(row => <article key={row.id}>
        <h2>{labels[row.action] ?? row.action}</h2>
        <p><time dateTime={row.created_at}>{dates.format(new Date(row.created_at))}</time> · Administrador: {row.actor_id === actor.id ? (actor.email ?? "Conta administrativa") : "Outra conta administrativa"}</p>
        {row.reason && <p>Motivo: {row.reason}</p>}
        {row.before_data?.message != null ? <><p><strong>Antes</strong></p><blockquote className="admin-history-text">{row.before_data.message}</blockquote><p><strong>Depois</strong></p><blockquote className="admin-history-text">{row.after_data?.message}</blockquote></> : <p>{row.before_data?.status} → {row.after_data?.status}</p>}
        <p><Link href={row.action.startsWith("EDIT_") ? "/admin/recados" : `/admin/reservas?q=${row.entity_id}&status=ALL`}>Consultar {row.action.startsWith("EDIT_") ? "recados" : "reserva"} →</Link></p>
      </article>)}
      {!data?.length && <p>Nenhuma alteração registrada nesta seleção.</p>}
    </section>
  </main>;
}
