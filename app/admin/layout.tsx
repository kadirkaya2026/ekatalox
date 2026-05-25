import { Sidebar } from "@/components/dashboard/sidebar";
import { requireSuperAdminPage } from "@/lib/auth/session";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireSuperAdminPage();

  return (
    <div className="min-h-screen bg-slate-50 md:grid md:grid-cols-[280px_1fr]">
      <div className="hidden md:block">
        <Sidebar
          mode="admin"
          title="Süper Admin"
          subtitle="Tenant ve şifre yönetimi"
        />
      </div>
      <main className="container-shell py-6">{children}</main>
    </div>
  );
}