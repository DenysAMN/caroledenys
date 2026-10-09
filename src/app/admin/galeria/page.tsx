import AdminGalleryManager from "@/components/AdminGalleryManager";
import { getAdminGallery } from "@/lib/gallery";
export const dynamic = "force-dynamic";
export default async function AdminGalleryPage() {
  const snapshot = await getAdminGallery();
  return <main className="admin-page">
    <header className="admin-page-head"><div><p className="eyebrow">Álbum do casal</p><h1>Fotos e galeria</h1></div><p>Envie fotos, escolha os destaques e organize o álbum sem precisar alterar o código.</p></header>
    {!snapshot.ready && <aside className="admin-management-notice" role="status"><h2>Ativar a gestão de fotos</h2><p>As fotos atuais estão preservadas. Para liberar os controles, copie o <a href="https://github.com/DenysAMN/caroledenys/blob/main/supabase/migrations/20261009000000_photo_gallery.sql" target="_blank" rel="noopener noreferrer">SQL da galeria</a> e execute inteiro, uma única vez, no <a href="https://supabase.com/dashboard/project/fmkgkpsxzmgnhnsnspdp/sql/new" target="_blank" rel="noopener noreferrer">SQL Editor do Supabase</a>. Depois atualize esta página.</p></aside>}
    <AdminGalleryManager snapshot={snapshot} />
  </main>;
}
