// Giriş bilgisi her ziyarette güncel olmalı; build anındaki veriyle
// statikleşmesin.
export const dynamic = "force-dynamic";

import { AdminLoginLogsPanel } from "@/components/admin/admin-login-logs-panel";
import { Header } from "@/components/dashboard/header";
import { getAdminLoginLogs } from "@/lib/data";

export default async function AdminLogsPage() {
  const entries = await getAdminLoginLogs();

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Loglar"
        title="Giriş logları"
        description="Kim şu an panelde, kim en son ne zaman girdi, hangi sayfadaydı. Panel açıkken dakikada bir kayıt düşer; 30 dakikadan uzun ara yeni ziyaret sayılır."
      />

      <AdminLoginLogsPanel entries={entries} loadedAt={new Date().toISOString()} />
    </div>
  );
}
