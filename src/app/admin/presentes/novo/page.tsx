import Link from "next/link";
import AdminGiftForm from "@/components/AdminGiftForm";
import { requireAdmin } from "@/lib/admin-auth";

export default async function NewGiftPage() {
  await requireAdmin();
  return (
    <main className="admin-page admin-form-page">
      <Link href="/admin/presentes" className="back-link">← Voltar aos presentes</Link>
      <header className="admin-page-head"><div><p className="eyebrow">Catálogo</p><h1>Novo presente</h1></div></header>
      <AdminGiftForm />
    </main>
  );
}
