import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SettingsSectionHeader } from "@/components/dashboard/settings-section-header";
import { buildCustomDomainRequestHref } from "@/lib/billing/plans";
import type { Tenant } from "@/lib/types";

export function TenantDomainInfo({ tenant }: { tenant: Tenant }) {
  const requestHref = buildCustomDomainRequestHref(
    tenant.company_name,
    tenant.subdomain,
    tenant.custom_domain,
  );

  return (
    <Card className="p-5">
      <SettingsSectionHeader icon={Globe} title="Özel alan adı" />

      {tenant.custom_domain ? (
        <p className="mb-4 text-sm text-slate-600">
          Mağazanız şu anda <strong>{tenant.subdomain}.ekatalox.com</strong> ve{" "}
          <strong>{tenant.custom_domain}</strong> adreslerinden yayında.
        </p>
      ) : (
        <p className="mb-4 text-sm text-slate-500">
          Mağazanız şu anda <strong>{tenant.subdomain}.ekatalox.com</strong> adresinde
          yayında. Kendi alan adınızı (ör. katalog.firmaniz.com) bağlamak için bizimle
          iletişime geçin — alan adını tedarik edip yönlendirmeyi ekibimiz yapar.
        </p>
      )}

      <Button asChild variant="secondary">
        <a href={requestHref} target="_blank" rel="noreferrer">
          {tenant.custom_domain ? "Alan adı değişikliği talep et" : "Özel alan adı talep et"}
        </a>
      </Button>
    </Card>
  );
}
