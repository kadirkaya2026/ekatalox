// Self-servis kayıt başvuruları — her açılışta güncel liste.
export const dynamic = "force-dynamic";

import { AdminSignupsPanel } from "@/components/admin/admin-signups-panel";
import { Header } from "@/components/dashboard/header";
import { listSignupRequests, SIGNUP_PAGE_SIZE, SIGNUP_STATUSES } from "@/lib/admin/self-service";
import type { SignupRequestStatus } from "@/lib/types";

export default async function AdminSignupsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const status = SIGNUP_STATUSES.includes(params.status as SignupRequestStatus)
    ? (params.status as SignupRequestStatus)
    : null;

  let initial = { rows: [], total: 0, page, pageSize: SIGNUP_PAGE_SIZE, status } as Awaited<
    ReturnType<typeof listSignupRequests>
  >;
  let loadError: string | null = null;

  try {
    initial = await listSignupRequests({ page, status });
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Başvurular okunamadı.";
  }

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Başvurular"
        title="Kayıt başvuruları"
        description="Esnaf kayıt formundan gelen başvurular; en yeni en üstte. Oluşan tenant'a satırdan geçebilirsiniz, başarısız denemeler hata mesajıyla listelenir."
      />

      <AdminSignupsPanel initial={initial} loadError={loadError} />
    </div>
  );
}
