import Link from "next/link";
import { logout } from "@/app/admin/login/actions";
import { getAdminUser } from "@/lib/admin-auth";

export default async function AdminNav() {
  const user = await getAdminUser();
  if (!user) return null;

  return (
    <aside className="admin-nav">
      <Link href="/admin" className="admin-brand">
        <span>C &amp; D</span>
        <small>Livro-caixa</small>
      </Link>
      <nav aria-label="Navegação administrativa">
        <Link href="/admin">Conferência</Link>
        <Link href="/admin/presentes">Presentes</Link>
        <Link href="/admin/galeria">Fotos</Link>
        <Link href="/admin/reservas">Reservas</Link>
        <Link href="/admin/historico">Histórico</Link>
        <Link href="/admin/convidados">Convidados</Link>
        <Link href="/admin/recados">Recados</Link>
      </nav>
      <form action={logout}>
        <button type="submit" className="admin-logout">Sair</button>
      </form>
    </aside>
  );
}
