import type { Metadata } from "next";
import AdminNav from "@/components/AdminNav";
import { getAdminUser } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Painel dos noivos",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAdminUser();
  return (
    <div className={`admin-root${user ? "" : " admin-root-no-nav"}`}>
      {user && <AdminNav />}
      <div className="admin-content">{children}</div>
    </div>
  );
}
