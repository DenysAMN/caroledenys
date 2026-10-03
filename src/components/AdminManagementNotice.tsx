export default function AdminManagementNotice() {
  return <aside className="admin-management-notice" role="status">
    <h2>Ativar as novas opções</h2>
    <p>A edição de recados e a gestão de reservas precisam de uma atualização do banco. Aprovar e ocultar recados, consultar e exportar continuam disponíveis.</p>
    <p>Abra o <a href="https://supabase.com/dashboard/project/fmkgkpsxzmgnhnsnspdp/sql/new" target="_blank" rel="noopener noreferrer">SQL Editor do Supabase</a> e execute o <a href="https://github.com/DenysAMN/caroledenys/blob/main/supabase/migrations/20261003000000_admin_management.sql" target="_blank" rel="noopener noreferrer">arquivo de atualização</a>. Depois, atualize esta página.</p>
  </aside>;
}
