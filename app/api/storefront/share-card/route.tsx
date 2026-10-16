import { loadShareCardTenant } from "@/lib/storefront/share-card";
import { renderShareCardImage } from "@/lib/storefront/share-card-image";

// Mağaza / sipariş takip / sipariş fişi linklerinin önizleme görseli
// (?tenant=<id>&k=store|track|receipt). Fiş kartı da mağaza başına tek adres:
// CDN'de bir kez üretilir, WhatsApp her yeni siparişte beklemeden alır.
export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tenantId = url.searchParams.get("tenant") ?? "";
  const tenant = UUID.test(tenantId) ? await loadShareCardTenant(tenantId) : null;
  if (!tenant) return new Response("Not Found", { status: 404 });
  const kind = url.searchParams.get("k");
  if (kind === "receipt") {
    return renderShareCardImage(tenant, "Sipariş Fişi", tenant.logoUrl ? tenant.name : "Siparişinizin fişini görüntülemek için dokunun");
  }
  return renderShareCardImage(tenant, kind === "track" ? "Sipariş Takip" : "Online Sipariş", tenant.logoUrl ? tenant.name : "Sipariş vermek için dokunun");
}
