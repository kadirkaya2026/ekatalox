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
        description="Tenant adminlerinin ve süper adminlerin en son ne zaman giriş yaptığını görüntüleyin."
      />

      <AdminLoginLogsPanel entries={entries} />
    </div>
  );
}
