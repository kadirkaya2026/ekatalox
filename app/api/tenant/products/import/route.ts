import { NextResponse } from "next/server";
import { isLikelyAlcohol } from "@/lib/products/alcohol";
import { revalidateStorefrontCache } from "@/lib/storefront/cache";
import { shouldAllowDemoFallback } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSessionContext } from "@/lib/auth/session";
import { getTenantCategories, getTenantProducts, getTenantPriceLists } from "@/lib/data";
import {
  createPriceListResolver,
  resolveImportPricesForTenant,
  resolveImportPricesWithReport,
} from "@/lib/price-lists/import";
import { ensureDefaultPriceListsForTenant } from "@/lib/price-lists/data";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { productImportRowsSchema } from "@/lib/validators/product";
import { getEffectiveProductLimit } from "@/lib/billing/plans";

// ---------------------------------------------------------------------------
// Normalize a category name for case/whitespace-insensitive comparison.
// Uses tr-TR locale so "İ" and "ı" are handled correctly.
// ---------------------------------------------------------------------------
function normalizeCategoryName(name: string) {
  // "ELEKTRONIK" (ASCII I) ile "Elektronik" aynı kategori; çift boşluk tek sayılır.
  return name
    .normalize("NFC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i");
}

const PAGE_SIZE = 1000;
const UPSERT_CHUNK = 500;
const PRICE_CHUNK = 1000;

// Büyük dosyalar (5.000+ satır) için süre sınırı.
export const maxDuration = 300;

function findDuplicateSkuCodes<T extends { sku_code: string }>(rows: T[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const row of rows) {
    if (seen.has(row.sku_code)) {
      duplicates.add(row.sku_code);
    }
    seen.add(row.sku_code);
  }

  return [...duplicates];
}

export async function POST(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const tenant = session.tenant!;
  const body = await request.json();
  const parsedHeaders: string[] = Array.isArray(body.parsedHeaders)
    ? (body.parsedHeaders as unknown[])
        .filter((value: unknown): value is string => typeof value === "string")
        .map((value: string) => value.trim())
    : [];
  const hasPackageQuantityColumn = parsedHeaders.includes("package_quantity");
  const hasCartonQuantityColumn = parsedHeaders.includes("carton_quantity");
  // Marka (0161): "Marka" sütunu olmayan eski dosyalar mevcut markaları silmesin.
  const hasBrandColumn = parsedHeaders.includes("brand");
  const parsed = productImportRowsSchema.safeParse(body.rows ?? []);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const rowIndex = typeof issue?.path?.[0] === "number" ? issue.path[0] : null;
    return NextResponse.json(
      {
        error: `${rowIndex !== null ? `Satır ${rowIndex + 2}: ` : ""}${issue?.message ?? "Dosya doğrulanamadı."}`,
      },
      { status: 400 },
    );
  }

  const rows = parsed.data;

  // Aynı sku_code (Model No) birden çok satırda geçerse upsert tek komutta
  // (tenant_id, sku_code) hedefini iki kez oluşturur ve Postgres
  // "ON CONFLICT DO UPDATE command cannot affect row a second time" hatası
  // verir. Sessizce atlamak yerine müşteriye tekrar eden model no'ları
  // gösterip dosyayı düzeltmesini istiyoruz — aksi halde bazı ürünler
  // hiç uyarı verilmeden içe aktarılmamış olur.
  const duplicateSkuCodes = findDuplicateSkuCodes(rows);

  if (duplicateSkuCodes.length) {
    return NextResponse.json(
      {
        error: `Dosyada aynı Model No birden fazla satırda kullanılmış: ${duplicateSkuCodes.join(", ")}. Lütfen her ürüne benzersiz bir model numarası verip dosyayı tekrar yükleyin.`,
      },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();

  // -------------------------------------------------------------------------
  // Demo / fallback mode (no Supabase credentials)
  // Auto-create is skipped in demo; missing categories still error out.
  // -------------------------------------------------------------------------
  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return NextResponse.json(
        { error: "Supabase production yapılandırması eksik." },
        { status: 500 },
      );
    }

    const currentProducts = await getTenantProducts(tenant.id);
    const categories = await getTenantCategories(tenant.id);
    const categoryMap = new Map(
      categories.map((c) => [normalizeCategoryName(c.name), c.id]),
    );

    const missingCategory = rows.find(
      (row) => !categoryMap.get(normalizeCategoryName(row.category_name)),
    );

    if (missingCategory) {
      return NextResponse.json(
        { error: `Kategori bulunamadı: ${missingCategory.category_name}` },
        { status: 400 },
      );
    }

    const demoPriceLists = await getTenantPriceLists(tenant.id);

    const mappedProducts = rows.map((row, index) => ({
      id: `demo-import-${index}-${row.sku_code}`,
      tenant_id: tenant.id,
      category_id: categoryMap.get(normalizeCategoryName(row.category_name))!,
      display_order: index + 1,
      created_at: new Date().toISOString(),
      sku_code: row.sku_code,
      product_name: row.product_name,
      brand: hasBrandColumn ? row.brand || null : null,
      image_url: row.image_url,
      currency: row.currency,
      prices: resolveImportPricesForTenant(
        row.prices,
        demoPriceLists,
      ).map((entry) => ({
        product_id: `demo-import-${index}-${row.sku_code}`,
        price_list_id: entry.price_list_id,
        price: entry.price,
      })),
      is_in_stock: row.is_in_stock ?? true,
      is_discount_active: false,
      discount_price: null,
      package_quantity: row.package_quantity,
      carton_quantity: row.carton_quantity,
    }));

    const merged = [
      ...mappedProducts,
      ...currentProducts.filter(
        (product) => !rows.some((row) => row.sku_code === product.sku_code),
      ),
    ];

    return NextResponse.json({
      count: rows.length,
      products: merged,
      categories,
    });
  }

  // -------------------------------------------------------------------------
  // Production path
  // -------------------------------------------------------------------------

  // 1. Mevcut ürünler — PostgREST sayfa başına 1000 satır döner; sayfalı oku
  //    (28 Eyl 2026 denetimi: >1000 ürünlü mağazada mevcut ürün "yeni" sanılıyordu).
  const existingProducts: Array<{ sku_code: string; display_order: number | null }> = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("products")
      .select("sku_code, display_order")
      .eq("tenant_id", tenant.id)
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) {
      return NextResponse.json(
        { error: "Mevcut ürünler okunamadı, lütfen tekrar deneyin." },
        { status: 500 },
      );
    }
    existingProducts.push(...((data ?? []) as typeof existingProducts));
    if (!data || data.length < PAGE_SIZE) break;
  }
  const existingSkuSet = new Set(existingProducts.map((item) => item.sku_code));
  const existingDisplayOrderMap = new Map(
    existingProducts.map((item) => [item.sku_code, item.display_order]),
  );

  // 2. Ürün limiti — kategori oluşturmadan ÖNCE; yalnız yeni Model No'lar sayılır.
  //    Yalnız güncelleme içeren dosya (yeni ürün yok) limitten bağımsız geçer.
  const newSkuCount = rows.filter((row) => !existingSkuSet.has(row.sku_code)).length;
  const effectiveLimit = getEffectiveProductLimit(tenant.plan, tenant.product_limit_addon);
  if (newSkuCount > 0 && existingSkuSet.size + newSkuCount > effectiveLimit) {
    const remaining = Math.max(effectiveLimit - existingSkuSet.size, 0);
    return NextResponse.json(
      {
        error: `Dosyada ${newSkuCount} yeni ürün var; paketinizde ${remaining} ürünlük yer kaldı (${existingSkuSet.size}/${effectiveLimit}). Ürün sayısını azaltın veya paketinizi yükseltin. Mevcut ürünlerin güncellemesi limite sayılmaz.`,
      },
      { status: 400 },
    );
  }

  // 3. Kategoriler: mevcutları önbelleğe al, eksikleri oluştur.
  const { data: categoryRows } = await supabase
    .from("categories")
    .select("id, name")
    .eq("tenant_id", tenant.id)
    .order("display_order", { ascending: true });
  const { data: lastCategory } = await supabase
    .from("categories")
    .select("display_order")
    .eq("tenant_id", tenant.id)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  let nextCategoryDisplayOrder = (lastCategory?.display_order ?? 0) + 1;

  const categoryCache = new Map<string, string>();
  for (const category of (categoryRows as Array<{ id: string; name: string }> | null) ?? []) {
    const key = normalizeCategoryName(category.name);
    if (!categoryCache.has(key)) categoryCache.set(key, category.id);
  }

  const uniqueCategoryNames = [
    ...new Set(rows.map((row) => row.category_name.trim().replace(/\s+/g, " "))),
  ];

  for (const rawName of uniqueCategoryNames) {
    const key = normalizeCategoryName(rawName);
    if (categoryCache.has(key)) {
      continue;
    }

    const { data: newCategory, error: createError } = await supabase
      .from("categories")
      .insert({
        tenant_id: tenant.id,
        name: rawName,
        display_order: nextCategoryDisplayOrder,
      })
      .select("id, name")
      .single();

    if (createError || !newCategory) {
      return NextResponse.json(
        { error: `"${rawName}" kategorisi oluşturulamadı. Lütfen tekrar deneyin.` },
        { status: 400 },
      );
    }

    categoryCache.set(key, (newCategory as { id: string; name: string }).id);
    nextCategoryDisplayOrder += 1;
  }

  let nextProductDisplayOrder =
    existingProducts.reduce(
      (maxValue, item) => Math.max(maxValue, item.display_order ?? 0),
      0,
    ) + 1;

  const priceLists = await ensureDefaultPriceListsForTenant(supabase, tenant.id);
  if (!priceLists.some((list) => !list.is_catalog_only)) {
    return NextResponse.json(
      { error: "Fiyat listeleriniz okunamadı, lütfen tekrar deneyin." },
      { status: 500 },
    );
  }

  // 4. Ürün satırları. Excel'de boş olan alan (görsel, stok) payload'a hiç
  //    konmaz ki mevcut değer ezilmesin.
  const payload = rows.map((row) => {
    const existingDisplayOrder = existingDisplayOrderMap.get(row.sku_code);
    const display_order = existingDisplayOrder ?? nextProductDisplayOrder;

    if (existingDisplayOrder === undefined) {
      nextProductDisplayOrder += 1;
    }

    const isNew = !existingSkuSet.has(row.sku_code);

    return {
      tenant_id: tenant.id,
      category_id: categoryCache.get(normalizeCategoryName(row.category_name))!,
      sku_code: row.sku_code,
      product_name: row.product_name,
      ...(hasBrandColumn ? { brand: row.brand || null } : {}),
      ...(row.image_url ? { image_url: row.image_url } : {}),
      currency: row.currency,
      // Stok hücresi boşsa: yeni ürün stokta açılır, mevcut ürüne dokunulmaz.
      ...(row.is_in_stock !== undefined
        ? { is_in_stock: row.is_in_stock }
        : isNew
          ? { is_in_stock: true }
          : {}),
      ...(hasPackageQuantityColumn ? { package_quantity: row.package_quantity } : {}),
      ...(hasCartonQuantityColumn ? { carton_quantity: row.carton_quantity } : {}),
      display_order,
    };
  });

  // Toplu upsert'te satırlar farklı kolon taşırsa eksik kolon NULL yazılır
  // (postgrest-js defaultToNull). Satırlar kolon imzasına göre gruplanır ve
  // 500'lük parçalarla yazılır; dönen id'ler fiyatlar için kullanılır.
  const groups = new Map<string, typeof payload>();
  for (const row of payload) {
    const signature = Object.keys(row).sort().join(",");
    const group = groups.get(signature) ?? [];
    group.push(row);
    groups.set(signature, group);
  }

  const productIdBySku = new Map<string, string>();
  for (const group of groups.values()) {
    for (let i = 0; i < group.length; i += UPSERT_CHUNK) {
      const chunk = group.slice(i, i + UPSERT_CHUNK);
      const { data, error } = await supabase
        .from("products")
        .upsert(chunk, { onConflict: "tenant_id,sku_code" })
        .select("id, sku_code");
      if (error) {
        return NextResponse.json(
          {
            error: `Ürünler kaydedilirken hata oluştu (${productIdBySku.size} ürün kaydedildi). Lütfen dosyayı tekrar yükleyin; kaydedilenler çoğalmaz.`,
          },
          { status: 400 },
        );
      }
      for (const product of (data ?? []) as Array<{ id: string; sku_code: string }>) {
        productIdBySku.set(product.sku_code, product.id);
      }
    }
  }

  // Tekel: alkollü görünen ürünler ayrı işaretlenir (yalnız true; elle konmuş
  // bayrak sıfırlanmaz). Upsert'e konmaz ki karışık dosyada NULL hatası olmasın.
  if (tenant.is_tekel) {
    const alcoholIds = rows
      .filter((row) => isLikelyAlcohol(row.product_name, row.category_name))
      .map((row) => productIdBySku.get(row.sku_code))
      .filter((id): id is string => Boolean(id));
    for (let i = 0; i < alcoholIds.length; i += UPSERT_CHUNK) {
      await supabase
        .from("products")
        .update({ is_alcohol: true })
        .eq("tenant_id", tenant.id)
        .in("id", alcoholIds.slice(i, i + UPSERT_CHUNK));
    }
  }

  // 5. Fiyatlar: tek seferde toplu; discount_price payload'da YOK ki mevcut
  //    liste indirimleri silinmesin. Eşleşmeyen fiyat sütunları raporlanır.
  const resolver = createPriceListResolver(priceLists);
  const priceRows: Array<{ product_id: string; price_list_id: string; price: number }> = [];
  const unmatchedLists = new Set<string>();
  let rowsWithoutPrice = 0;

  for (const row of rows) {
    const productId = productIdBySku.get(row.sku_code);
    if (!productId) continue;
    const { prices, unmatched } = resolveImportPricesWithReport(row.prices, priceLists, resolver);
    unmatched.forEach((name) => unmatchedLists.add(name));
    if (!prices.length) rowsWithoutPrice += 1;
    for (const entry of prices) {
      priceRows.push({ product_id: productId, price_list_id: entry.price_list_id, price: entry.price });
    }
  }

  let failedPriceRows = 0;
  for (let i = 0; i < priceRows.length; i += PRICE_CHUNK) {
    const chunk = priceRows.slice(i, i + PRICE_CHUNK);
    const { error } = await supabase
      .from("product_prices")
      .upsert(chunk, { onConflict: "product_id,price_list_id" });
    if (error) failedPriceRows += chunk.length;
  }

  const warnings: string[] = [];
  if (unmatchedLists.size) {
    warnings.push(
      `Şu fiyat sütunları mağazanızdaki bir fiyat listesiyle eşleşmedi ve atlandı: ${[...unmatchedLists]
        .map((name) => `"${name}"`)
        .join(", ")}. Fiyat Listeleri sayfasındaki liste sayısını kontrol edin.`,
    );
  }
  if (rowsWithoutPrice) {
    warnings.push(`${rowsWithoutPrice} üründe hiç fiyat yoktu; bu ürünler fiyatsız kaldı.`);
  }
  if (failedPriceRows) {
    warnings.push(
      `${failedPriceRows} fiyat kaydedilemedi. Lütfen dosyayı tekrar yükleyin (ürünler çoğalmaz).`,
    );
  }

  // 6. Güncel liste (sayfalı) — istemci tablosu yenilensin.
  const products: Array<Record<string, unknown>> = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    products.push(...((data ?? []) as Array<Record<string, unknown>>));
    if (!data || data.length < PAGE_SIZE) break;
  }
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  // Vitrin onbellegini tazele — degisiklik musteriye aninda yansisin.
  revalidateStorefrontCache({ tenantId: tenant.id, subdomain: tenant.subdomain });

  return NextResponse.json({
    count: rows.length,
    created: newSkuCount,
    updated: rows.length - newSkuCount,
    warnings,
    products,
    categories: categories ?? [],
  });
}
