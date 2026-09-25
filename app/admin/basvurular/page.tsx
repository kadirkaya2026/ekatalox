// Self-servis kayıt başvuruları — her açılışta güncel liste.
export const dynamic = "force-dynamic";

import { AdminDomainRequestsPanel } from "@/components/admin/admin-domain-requests-panel";
import { AdminSignupsPanel } from "@/components/admin/admin-signups-panel";
import { Header } from "@/components/dashboard/header";
import { listSignupRequests, SIGNUP_PAGE_SIZE, SIGNUP_STATUSES } from "@/lib/admin/self-service";
import { listDomainRequestsForAdmin } from "@/lib/kurumsal/domain-requests";
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
  // Kurumsal site "Yeni alan adı seç" talepleri (0135); tablo yoksa boş liste.
  const domainRequests = await listDomainRequestsForAdmin();

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Başvurular"
        title="Kayıt başvuruları"
        description="Esnaf kayıt formundan gelen başvurular; en yeni en üstte. Oluşan tenant'a satırdan geçebilirsiniz, başarısız denemeler hata mesajıyla listelenir."
      />

      <AdminSignupsPanel initial={initial} loadError={loadError} />

      <Header
        eyebrow="Başvurular"
        title="Alan adı talepleri"
        description="Kurumsal site sihirbazından gelen 'Yeni alan adı seç' talepleri. Alan adını Vercel'den satın alıp tenant'ın kurumsal_domain'ine yazdıktan sonra durumu 'Satın alındı' yapın."
      />
      <AdminDomainRequestsPanel initial={domainRequests} />
    </div>
  );
}
