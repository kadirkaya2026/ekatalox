import { resolveShortLinkRecord } from "@/lib/storage/short-links";
import { loadShareCardTenant } from "@/lib/storefront/share-card";
import { renderShareCardImage } from "@/lib/storefront/share-card-image";

// Sipariş fişi kısa linkinin önizleme görseli.
export const runtime = "nodejs";

export async function GET(_request: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const record = await resolveShortLinkRecord(code);
  const tenant = record ? await loadShareCardTenant(record.tenantId) : null;
  if (!record || !tenant) return new Response("Not Found", { status: 404 });
  return renderShareCardImage(tenant, "Sipariş Fişi", tenant.logoUrl ? tenant.name : "Siparişinizin fişini görüntülemek için dokunun");
}
