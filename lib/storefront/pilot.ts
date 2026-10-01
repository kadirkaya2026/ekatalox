// Vitrin pilot özellikleri (1 Eki 2026): Sunix örneğinden alınan model ızgarası,
// sepet özeti ve hızlı adet düğmeleri önce yalnız burada listelenen mağazalarda
// açılır. Beğenilirse diğer mağazalara açmak = kimliği listeye eklemek ya da
// kontrolü kaldırmak.
const STOREFRONT_PILOT_TENANT_IDS = new Set<string>([
  "ebeeec82-7cd9-4ab8-bea9-f3dc2a5bfe0c", // Lucatech (toptan.lucatech.com.tr)
]);

export function isStorefrontPilotTenant(tenantId: string | null | undefined): boolean {
  return Boolean(tenantId && STOREFRONT_PILOT_TENANT_IDS.has(tenantId));
}

/** Hızlı adet düğmeleri (Sunix: 5 / 10 / 20 / 50). */
export const PILOT_QUICK_QUANTITIES = [5, 10, 20, 50] as const;
