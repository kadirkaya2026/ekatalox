import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { revalidateStorefrontCache } from "@/lib/storefront/cache";
import { publicationRevision, previousPublication } from "@/lib/storefront/sector-design/publication";
import { readDesignDocument, DESIGNS, prepareDesignUpdate } from "@/lib/storefront/sector-design/config";

export async function PATCH(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) return guard;
  const { tenant } = await getSessionContext();
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || typeof body.baseRevision !== "string") return NextResponse.json({ error: "Güncel düzenleyiciyi açıp tekrar deneyin." }, { status: 428 });
  const db = createSupabaseAdminClient();
  if (!db) return NextResponse.json({ error: "Veritabanına ulaşılamıyor." }, { status: 503 });
  const { data, error: readError } = await db.from("tenant_storefront_settings").select("sector_design").eq("tenant_id", tenant!.id).maybeSingle();
  if (readError) return NextResponse.json({ error: "Tema okunamadı." }, { status: 503 });
  if (publicationRevision(data?.sector_design) !== body.baseRevision) return NextResponse.json({ error: "Mağaza başka bir sekmede güncellendi. Taslağınız korunuyor; güncel yayını yeni sekmede açıp karşılaştırın." }, { status: 409 });
  const previous = body.restore === true ? previousPublication(data?.sector_design, tenant!.sector) : null;
  if (body.restore === true && !previous) return NextResponse.json({ error: "Geri dönülebilecek önceki tema yayını yok." }, { status: 400 });
  const input = previous ? { themeId: previous.themeId, mode: previous.mode, content: previous.content[previous.themeId] } : { themeId: body.themeId, mode: body.mode, content: body.content };
  const preflight = prepareDesignUpdate(tenant!.sector, input, null);
  if ("error" in preflight) return NextResponse.json({ error: preflight.error }, { status: 400 });
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
  const result = prepareDesignUpdate(tenant!.sector, input, data?.sector_design);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  const design = DESIGNS.find(d => d.id === result.document.themeId)!;
  const publication = { ...result.document, _publication: { id: crypto.randomUUID(), previous: readDesignDocument(data?.sector_design, tenant!.sector) } };
  const row = { sector_design: publication, theme_key: design.overlayTheme, font_key: design.font };
  // Compare-and-swap on the complete JSON value: stale tabs cannot overwrite a newer publication.
  let write;
  if (data) {
    let update = db.from("tenant_storefront_settings").update(row).eq("tenant_id", tenant!.id);
    update = data.sector_design == null ? update.is("sector_design", null) : update.eq("sector_design", JSON.stringify(data.sector_design));
    write = await update.select("tenant_id");
  } else {
    write = await db.from("tenant_storefront_settings").insert({ tenant_id: tenant!.id, ...row }).select("tenant_id");
  }
  const { error } = write;
  if (error?.code === "23505" || (!error && !write.data?.length)) return NextResponse.json({ error: "Başka bir yayın yapıldı. Taslağınızı kaybetmeden güncel mağazayı tekrar açın." }, { status: 409 });
  if (error) return NextResponse.json({ error: "Tema kaydedilemedi. Tekrar deneyin." }, { status: 500 });
  revalidateStorefrontCache({ tenantId: tenant!.id, subdomain: tenant!.subdomain });
  return NextResponse.json({ design: result.document, revision: publication._publication.id, previous: publication._publication.previous });
}
