import { Header } from "@/components/dashboard/header";
import { DealerApplicationsManager } from "@/components/dashboard/dealer-applications-manager";
import { Card } from "@/components/ui/card";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { hasKurumsalSiteAccess } from "@/lib/kurumsal/domain";
import Link from "next/link";
import type { DealerApplication } from "@/lib/kurumsal/applications";
import { getKurumsalSite } from "@/lib/storefront/kurumsal-content";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Kurumsal sayfadaki (/kurumsal#basvuru) formdan gelen bayi başvuruları.
async function getDealerApplications(tenantId: string): Promise<DealerApplication[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("dealer_applications")
    .select("id, company_name, contact_name, phone, city, note, status, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[kurumsal] başvurular okunamadı:", error.message);
    return [];
  }
  return (data ?? []) as DealerApplication[];
}

export default async function DealerApplicationsPage() {
  const session = await requireTenantAdminPage();
  const tenant = session.tenant!;

  // Kurumsal site (ve başvuru formu) yalnız en üst pakette.
  if (!hasKurumsalSiteAccess(tenant)) {
    return (
      <div className="space-y-6">
        <Header
          eyebrow="Bayi Başvuruları"
          title="Bayi Başvuruları"
          description="Kurumsal sitenizdeki başvuru formundan gelen bayilik talepleri."
        />
        <Card className="p-6 text-sm leading-6 text-muted-foreground">
          Kurumsal site ve bayi başvuru formu en üst pakette kullanılabilir.{" "}
          <Link href="/settings/kurumsal" className="font-semibold text-emerald-700 underline underline-offset-4">
            Ayrıntılar ve paket yükseltme
          </Link>
        </Card>
      </div>
    );
  }

  const [applications, site] = await Promise.all([
    getDealerApplications(tenant.id),
    getKurumsalSite(tenant.id),
  ]);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Bayi Başvuruları"
        title="Bayi Başvuruları"
        description="Kurumsal sitenizdeki başvuru formundan gelen bayilik talepleri. Firmayı arayın, durumunu güncelleyin; onayladıklarınıza Şifreler sayfasından portal şifresi verin."
      />
      <DealerApplicationsManager
        initialApplications={applications}
        formLive={Boolean(site?.is_published && site.content.sections.form && tenant.kurumsal_domain)}
      />
    </div>
  );
}
