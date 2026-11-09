import AdminHoneymoonPlanner from "@/components/honeymoon/AdminHoneymoonPlanner";
import { salvarPlano } from "@/app/admin/actions/honeymoon";
import { getAdminHoneymoonPlan } from "@/lib/honeymoon";

export const dynamic = "force-dynamic";

export default async function AdminHoneymoonPage() {
  const leitura = await getAdminHoneymoonPlan();
  return <main className="admin-page">
    <header className="admin-page-head">
      <div><p className="eyebrow">Só para os noivos</p><h1>Lua de mel</h1></div>
      <p>Roteiro, lugares, prazos e gastos da viagem, editados aqui mesmo e gravados ao clicar em Salvar.</p>
    </header>
    {leitura.estado === "sem-tabela" && <aside className="admin-management-notice" role="status">
      <h2>Ativar o planejador da lua de mel</h2>
      <p>O banco ainda não tem a tabela desta página. Copie o <a href="https://github.com/DenysAMN/caroledenys/blob/main/supabase/migrations/20261108000000_honeymoon_plan.sql" target="_blank" rel="noopener noreferrer">SQL da lua de mel</a> e execute inteiro, uma única vez, no <a href="https://supabase.com/dashboard/project/fmkgkpsxzmgnhnsnspdp/sql/new" target="_blank" rel="noopener noreferrer">SQL Editor do Supabase</a>. Depois atualize esta página.</p>
    </aside>}
    {leitura.estado === "erro" && <aside className="admin-management-notice" role="alert">
      <h2>Não foi possível abrir o planejador</h2>
      <p>A leitura do banco falhou agora. Atualize a página em alguns instantes; nada foi alterado.</p>
    </aside>}
    {leitura.estado === "pronto" && <AdminHoneymoonPlanner inicial={leitura.plano} revisao={leitura.revisao} hoje={leitura.hoje}
      ultimaGravacao={leitura.ultimaGravacao} errosLeitura={leitura.errosLeitura} bruto={leitura.bruto} salvar={salvarPlano} />}
  </main>;
}
