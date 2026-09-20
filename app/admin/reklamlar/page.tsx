// eKatalox reklam yerleşimleri — her açılışta güncel ayar.
export const dynamic = "force-dynamic";

import { AdminAdsPanel } from "@/components/admin/admin-ads-panel";
import { Header } from "@/components/dashboard/header";
import { getStorefrontAdsConfig } from "@/lib/ads/server";

export default async function AdminAdsPage() {
  const config = await getStorefrontAdsConfig();

  return (
    <div className="space-y-6">
      <Header
        eyebrow="eKatalox Reklamları"
        title="Ücretsiz plandaki vitrinlerde reklam"
        description="Yalnızca Ücretsiz paketteki mağazaların vitrininde görünen eKatalox reklamları. Her yerleşimi ayrı ayrı açıp kapatabilir, metinleri ve pop-up sıklığını buradan değiştirebilirsiniz. Ücretli paketlerde hiçbir reklam görünmez."
      />

      <AdminAdsPanel initialConfig={config} />
    </div>
  );
}
