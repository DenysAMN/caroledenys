import AdminLoginForm from "@/components/AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <p className="eyebrow">Área reservada</p>
        <h1>Painel dos noivos</h1>
        <p className="admin-login-copy">
          Entre para conferir pagamentos e cuidar da lista de presentes.
        </p>
        <AdminLoginForm />
      </section>
    </main>
  );
}
