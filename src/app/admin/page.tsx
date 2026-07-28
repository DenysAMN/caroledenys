import AdminQueue from "@/components/AdminQueue";
import { getAdminDashboardMetrics } from "@/lib/admin-dashboard";
import { getPendingPayments } from "@/lib/admin-payments";
import { formatBRL } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [metrics, payments] = await Promise.all([
    getAdminDashboardMetrics(),
    getPendingPayments(),
  ]);

  return (
    <main className="admin-page">
      <header className="admin-page-head">
        <div>
          <p className="eyebrow">31 de janeiro de 2027</p>
          <h1>Conferência</h1>
        </div>
        <p>Confira o extrato bancário antes de tomar uma decisão.</p>
      </header>

      <section className="admin-metrics" aria-label="Resumo">
        <article><span>Total confirmado</span><strong>{formatBRL(metrics.paidCents)}</strong></article>
        <article><span>Aguardando conferência</span><strong>{metrics.pendingCount}</strong></article>
        <article><span>Presentes concluídos</span><strong>{metrics.completedGifts}</strong></article>
      </section>

      <section className="admin-section-head">
        <p className="eyebrow">Fila de hoje</p>
        <h2>Comprovantes recebidos</h2>
      </section>
      <AdminQueue payments={payments} />
    </main>
  );
}
