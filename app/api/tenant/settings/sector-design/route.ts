import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { revalidateStorefrontCache } from "@/lib/storefront/cache";
import { DESIGNS, prepareDesignUpdate } from "@/lib/storefront/sector-design/config";

export async function PATCH(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) return guard;
  const { tenant } = await getSessionContext();
  const input: unknown = await request.json().catch(() => null);
  const preflight = prepareDesignUpdate(tenant!.sector, input, null);
  if ("error" in preflight) return NextResponse.json({ error: preflight.error }, { status: 400 });
  const db = createSupabaseAdminClient();
  if (!db) return NextResponse.json({ error: "Tema kaydetmek için veritabanı bağlantısı gerekli." }, { status: 503 });
  const selectedContent = preflight.document.content[preflight.document.themeId]!;
  const categoryIds = [...new Set(Object.entries(selectedContent).filter(([key, value]) => key.endsWith("CategoryId") && value && value !== "all").map(([, value]) => String(value)))];
  const productId = "featureProductId" in selectedContent ? selectedContent.featureProductId : "";
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (categoryIds.some(id => !uuid.test(id)) || (productId && !uuid.test(productId))) return NextResponse.json({ error: "Kategori veya ürün seçimi geçersiz." }, { status: 400 });
  if (categoryIds.length) {
    const found = await db.from("categories").select("id").eq("tenant_id", tenant!.id).in("id", categoryIds);
    if (found.error) return NextResponse.json({ error: "Kategoriler doğrulanamadı." }, { status: 503 });
    if (found.data.length !== categoryIds.length) return NextResponse.json({ error: "Yalnız kendi mağazanızın kategorilerini seçebilirsiniz." }, { status: 400 });
  }
  if (productId) {
    const found = await db.from("products").select("id").eq("tenant_id", tenant!.id).eq("id", productId).maybeSingle();
    if (found.error) return NextResponse.json({ error: "Ürün doğrulanamadı." }, { status: 503 });
    if (!found.data) return NextResponse.json({ error: "Yalnız kendi mağazanızın ürünlerini seçebilirsiniz." }, { status: 400 });
  }
  const { data, error: readError } = await db.from("tenant_storefront_settings").select("sector_design").eq("tenant_id", tenant!.id).maybeSingle();
  if (readError) return NextResponse.json({ error: "Tema altyapısı hazır değil. Sektör tasarımı veritabanı güncellemesini kontrol edin." }, { status: 503 });
  const result = prepareDesignUpdate(tenant!.sector, input, data?.sector_design);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  const design = DESIGNS.find(d => d.id === result.document.themeId)!;
  const { error } = await db.from("tenant_storefront_settings").upsert({ tenant_id: tenant!.id, sector_design: result.document, theme_key: design.overlayTheme, font_key: design.font }, { onConflict: "tenant_id" });
  if (error) return NextResponse.json({ error: "Tema kaydedilemedi. Tekrar deneyin." }, { status: 500 });
  revalidateStorefrontCache({ tenantId: tenant!.id, subdomain: tenant!.subdomain });
  return NextResponse.json({ design: result.document });
}
