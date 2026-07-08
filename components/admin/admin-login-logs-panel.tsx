import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { AdminLoginLogEntry } from "@/lib/types";

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

function formatRelative(value: string | null) {
  if (!value) {
    return "Hiç giriş yapmadı";
  }

  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return "Az önce";
  if (minutes < 60) return `${minutes} dk önce`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saat önce`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} gün önce`;

  const months = Math.floor(days / 30);
  return `${months} ay önce`;
}

export function AdminLoginLogsPanel({
  entries,
}: {
  entries: AdminLoginLogEntry[];
}) {
  if (!entries.length) {
    return (
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-slate-900">Giriş logları</h2>
        <p className="mt-2 text-sm text-slate-600">
          Henüz kayıtlı kullanıcı bulunmuyor.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Giriş logları</h2>
        <p className="text-xs text-slate-500">
          {entries.length} kullanıcı · en son giriş yapan en üstte
        </p>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-[0.12em] text-slate-500">
              <th className="px-3 py-2 font-medium">Kullanıcı</th>
              <th className="px-3 py-2 font-medium">Rol</th>
              <th className="px-3 py-2 font-medium">Tenant</th>
              <th className="px-3 py-2 font-medium">Son giriş</th>
              <th className="px-3 py-2 font-medium">Hesap açılışı</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr
                key={entry.user_id}
                className="border-t border-slate-100 dark:border-slate-800"
              >
                <td className="px-3 py-3">
                  <div className="font-medium text-slate-900">
                    {entry.full_name ?? "İsimsiz kullanıcı"}
                  </div>
                  <div className="text-xs text-slate-500">{entry.email}</div>
                </td>
                <td className="px-3 py-3">
                  {entry.role === "super_admin" ? (
                    <Badge className="bg-violet-100 text-violet-700">
                      Süper Admin
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-100 text-emerald-700">
                      Tenant Admin
                    </Badge>
                  )}
                </td>
                <td className="px-3 py-3">
                  {entry.tenant_name ? (
                    <div>
                      <div className="text-slate-900">{entry.tenant_name}</div>
                      {entry.tenant_subdomain ? (
                        <div className="text-xs text-slate-500">
                          {entry.tenant_subdomain}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <div
                    className={
                      entry.last_sign_in_at
                        ? "font-medium text-slate-900"
                        : "text-slate-400"
                    }
                  >
                    {formatRelative(entry.last_sign_in_at)}
                  </div>
                  {entry.last_sign_in_at ? (
                    <div className="text-xs text-slate-500">
                      {formatDateTime(entry.last_sign_in_at)}
                    </div>
                  ) : null}
                </td>
                <td className="px-3 py-3 text-slate-600">
                  {formatDateTime(entry.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
