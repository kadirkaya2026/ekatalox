import { resolveBrandPalette, normalizeBrandPalette } from "@/lib/storefront/brand-palette";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// WhatsApp/iMessage link önizlemesi (15 Eki 2026, Lucatech): sipariş fişi kısa
// linki PDF'e yönlendiği için önizleme boş geliyordu, mağaza sayfaları ise
// eKatalox'un genel tanıtım kartını gösteriyordu. Kart mağazanın adı, logosu ve
// marka rengiyle üretilir.

export { isLinkPreviewBot } from "@/lib/storefront/link-preview-bot";

export type ShareCardTenant = { name: string; title: string | null; description: string | null; logoUrl: string | null; accent: string };

export async function loadShareCardTenant(tenantId: string): Promise<ShareCardTenant | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;
  const [{ data: tenant }, { data: settings }] = await Promise.all([
    supabase.from("tenants").select("company_name").eq("id", tenantId).maybeSingle(),
    supabase
      .from("tenant_storefront_settings")
      .select("logo_url, storefront_title, storefront_description, brand_primary_color, brand_accent_color, brand_palette")
      .eq("tenant_id", tenantId)
      .maybeSingle(),
  ]);
  if (!tenant) return null;
  const palette = resolveBrandPalette({
    brand_primary_color: settings?.brand_primary_color ?? null,
    brand_accent_color: settings?.brand_accent_color ?? null,
    brand_palette: normalizeBrandPalette(settings?.brand_palette),
  });
  return {
    name: tenant.company_name?.trim() || "Mağaza",
    title: settings?.storefront_title?.trim() || null,
    description: settings?.storefront_description?.trim() || null,
    // Kart üreticisi (satori) webp okuyamıyor; o durumda logo yerine ad yazılır.
    logoUrl: settings?.logo_url && !/\.webp(\?|$)/i.test(settings.logo_url) ? settings.logo_url : null,
    accent: palette.addToCart ?? palette.headerCart ?? "#0f172a",
  };
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Botlara verilen küçük sayfa: önizleme etiketleri + hedefe yönlendirme. */
export function shareCardHtml(params: { title: string; description: string; imageUrl: string; pageUrl: string; targetUrl: string; siteName: string; imageIsCard?: boolean }) {
  const t = escapeHtml(params.title);
  const d = escapeHtml(params.description);
  const target = escapeHtml(params.targetUrl);
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8">
<title>${t}</title>
<meta name="description" content="${d}">
<meta name="robots" content="noindex, nofollow">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${escapeHtml(params.siteName)}">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${d}">
<meta property="og:url" content="${escapeHtml(params.pageUrl)}">
<meta property="og:image" content="${escapeHtml(params.imageUrl)}">
${params.imageIsCard === false ? "" : `<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">`}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${t}">
<meta name="twitter:description" content="${d}">
<meta name="twitter:image" content="${escapeHtml(params.imageUrl)}">
<meta http-equiv="refresh" content="0;url=${target}">
</head><body><a href="${target}">${t}</a></body></html>`;
}
