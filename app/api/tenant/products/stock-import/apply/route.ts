import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSessionContext } from "@/lib/auth/session";
import { getTenantPriceLists } from "@/lib/data";
import { normalizeProductRecord } from "@/lib/products/records";
import { productWithVariantsAndPricesSelect } from "@/lib/products/queries";
import { normalizeCode } from "@/lib/products/stock-import-matching";
import { importProductsFromMasterCatalog } from "@/lib/products/import-from-master-catalog";
import { buildCategoryCache, ensureCategoryPath, normalizeCategoryName } from "@/lib/categories/ensure-hierarchy";
import { resolveCategoryPath } from "@/lib/market-catalog/category-taxonomy";
import { compactProductDisplayOrder } from "@/lib/products/reorder";
import { getEffectiveProductLimit } from "@/lib/billing/plans";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { revalidateStorefrontCache } from "@/lib/storefront/cache";
import { chunkArray } from "@/lib/utils";
import { stockImportApplyRequestSchema, type StockImportApplyRowInput } from "@/lib/validators/stock-import";

const ID_CHUNK_SIZE = 200;
const UPSERT_CHUNK_SIZE = 500;
const SKU_REPAIR_CONCURRENCY = 20;

// Master Katalog'a sadece görseli olan (kendi Storage'ımıza yüklenmiş, dış
// CDN hotlink değil) ürünler eklenir; diğer tenant'lar da bu ürünü katalogda
// bulup aktarabilsin. "Yeni ürün oluştur" akışında (aşağıda) VE barkod
// düzeltme (self-healing SKU repair) akışında aynı mantık kullanılıyor —
// ikisi de burada birleşiyor.
async function contributeToMasterCatalog(
  supabase: SupabaseClient,
  candidates: Array<{ sku_code: string; product_name: string; category_name: string; image_url: string }>,
): Promise<number> {
  if (!candidates.length) return 0;

  const candidateSkus = [...new Set(candidates.map((c) => c.sku_code))];
  const existingSkus = new Set<string>();

  for (const skuChunk of chunkArray(candidateSkus, ID_CHUNK_SIZE)) {
    const { data: existingRows } = await supabase
      .from("market_catalog_products")
      .select("sku_code")
      .in("sku_code", skuChunk);

    for (const row of existingRows ?? []) {
      existingSkus.add(row.sku_code as string);
    }
  }

  const newCatalogRows = candidates
    .filter((candidate) => !existingSkus.has(candidate.sku_code))
    .map((candidate) => ({ ...candidate, source: "tenant_stock_import" }));

  if (!newCatalogRows.length) return 0;

  for (const chunk of chunkArray(newCatalogRows, UPSERT_CHUNK_SIZE)) {
    await supabase
      .from("market_catalog_products")
      .upsert(chunk, { onConflict: "source,sku_code", ignoreDuplicates: true });
  }

  return newCatalogRows.length;
}

async function fetchAllTenantProductIds(supabase: SupabaseClient, tenantId: string) {
  const ids: string[] = [];
  const PAGE_SIZE = 1000;

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data } = await supabase
      .from("products")
      .select("id")
      .eq("tenant_id", tenantId)
      .range(from, from + PAGE_SIZE - 1);

    const page = data ?? [];
    ids.push(...page.map((row) => row.id as string));
    if (page.length < PAGE_SIZE) break;
  }

  return ids;
}

export async function POST(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const tenant = session.tenant!;

  if (tenant.business_type !== "market") {
    return NextResponse.json(
      { error: "Bu özellik sadece market tipi hesaplar için kullanılabilir." },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = stockImportApplyRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Geçersiz istek." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Sunucu yapılandırması eksik." },
      { status: 500 },
    );
  }

  // Barkodu Master Katalog'da bulunan ama tenant'ta henüz olmayan satırlar
  // önce mağazaya aktarılır; dönen productId'ler aşağıdaki normal
  // "productId'si olan satır" akışına dahil edilir. Aynı sku_code birden
  // fazla satırda geçebilir (dosyada tekrar) — tek seferde aktarılır.
  const masterCatalogRows = parsed.data.updates.filter(
    (update): update is StockImportApplyRowInput & { masterCatalogSkuCode: string } =>
      !update.productId && Boolean(update.masterCatalogSkuCode),
  );
  const uniqueSkuCodesToImport = [...new Set(masterCatalogRows.map((row) => row.masterCatalogSkuCode))];

  let importedProductIdBySku = new Map<string, string>();
  let skippedForCatalogLimitCount = 0;

  if (uniqueSkuCodesToImport.length) {
    const importResult = await importProductsFromMasterCatalog(supabase, tenant, uniqueSkuCodesToImport);
    if (!importResult.ok) {
      return NextResponse.json({ error: importResult.error }, { status: 400 });
    }
    importedProductIdBySku = new Map(importResult.insertedProducts.map((p) => [p.sku_code, p.id]));
    skippedForCatalogLimitCount = importResult.skippedForLimitCount;
  }

  // Hiçbir yerde eşleşmeyen ve kullanıcının "yeni ürün olarak oluştur"
  // dediği satırlar — kategori seçimi (categoryId) UI'da zorunlu tutulduğu
  // için burada sadece gerçekten tenant'a ait bir kategoriye işaret ettiği
  // tekrar doğrulanıyor. Ürün limiti, tam bu sırada (master katalogdan az
  // önce aktarılanlar dahil) güncel sayıya göre kontrol edilir.
  const newProductRows = parsed.data.updates.filter(
    (
      update,
    ): update is StockImportApplyRowInput & {
      newProduct: NonNullable<StockImportApplyRowInput["newProduct"]>;
    } => !update.productId && !update.masterCatalogSkuCode && Boolean(update.newProduct),
  );

  const createdProductRows: Array<StockImportApplyRowInput & { productId: string }> = [];
  let skippedInvalidCategoryCount = 0;
  let skippedForNewProductLimitCount = 0;
  let addedToMasterCatalogCount = 0;

  if (newProductRows.length) {
    const { data: categoryRows } = await supabase
      .from("categories")
      .select("id, name, parent_id")
      .eq("tenant_id", tenant.id);
    const validCategoryIds = new Set((categoryRows ?? []).map((row) => row.id as string));
    const categoryNameById = new Map(
      (categoryRows ?? []).map((row) => [row.id as string, row.name as string]),
    );

    // Tenant'ta o isimde bir kategori henüz yoksa (ör. yeni açılan, ürünü
    // sıfır bir tenant — kategori dropdown'ı UI'da tamamen boş olur)
    // kullanıcı categoryId yerine elle bir newCategoryName girmiş olabilir.
    // Master Katalog importundakiyle (bkz. import-from-master-catalog.ts)
    // aynı ensureCategoryPath ile burada da oluşturulur/eşleştirilir — aynı
    // isim birden fazla satırda geçiyorsa tek kategori olarak birleşir.
    const rowsNeedingNewCategory = newProductRows.filter(
      (row) => !row.newProduct.categoryId && row.newProduct.newCategoryName,
    );

    if (rowsNeedingNewCategory.length) {
      const categoryCache = buildCategoryCache(
        (categoryRows as Array<{ id: string; name: string; parent_id: string | null }> | null) ?? [],
      );
      const { data: lastCategory } = await supabase
        .from("categories")
        .select("display_order")
        .eq("tenant_id", tenant.id)
        .order("display_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      const nextCategoryDisplayOrder = { value: (lastCategory?.display_order ?? 0) + 1 };

      const uniqueNewCategoryNames = [
        ...new Set(rowsNeedingNewCategory.map((row) => row.newProduct.newCategoryName!.trim())),
      ];
      const resolvedIdByNormalizedName = new Map<string, string>();

      for (const rawName of uniqueNewCategoryNames) {
        // rawName Master Katalog taksonomisinde bilinen bir yaprak isimse
        // (dropdown'dan seçildiyse — bkz. stock-import-panel.tsx)
        // resolveCategoryPath doğru ana kategoriyi de yola ekler; bilinmeyen
        // (serbest yazılmış) bir isimse tek elemanlı kök yol döner — davranış
        // Master Katalog importuyla (import-from-master-catalog.ts) birebir
        // aynı.
        const categoryId = await ensureCategoryPath(
          supabase,
          tenant.id,
          categoryCache,
          resolveCategoryPath(rawName),
          nextCategoryDisplayOrder,
        );
        validCategoryIds.add(categoryId);
        categoryNameById.set(categoryId, rawName);
        resolvedIdByNormalizedName.set(normalizeCategoryName(rawName), categoryId);
      }

      for (const row of rowsNeedingNewCategory) {
        const resolvedId = resolvedIdByNormalizedName.get(normalizeCategoryName(row.newProduct.newCategoryName!.trim()));
        if (resolvedId) {
          row.newProduct.categoryId = resolvedId;
        }
      }
    }

    const eligibleRows = newProductRows.filter(
      (row) => row.newProduct.categoryId && validCategoryIds.has(row.newProduct.categoryId),
    );
    skippedInvalidCategoryCount = newProductRows.length - eligibleRows.length;

    if (eligibleRows.length) {
      await compactProductDisplayOrder(supabase, tenant.id);

      const { count: currentProductCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenant.id);

      const effectiveLimit = getEffectiveProductLimit(tenant.plan, tenant.product_limit_addon);
      const remainingCapacity = Math.max(0, effectiveLimit - (currentProductCount ?? 0));
      const rowsToInsert = eligibleRows.slice(0, remainingCapacity);
      skippedForNewProductLimitCount = eligibleRows.length - rowsToInsert.length;

      if (rowsToInsert.length) {
        const { data: lastProduct } = await supabase
          .from("products")
          .select("display_order")
          .eq("tenant_id", tenant.id)
          .order("display_order", { ascending: false })
          .limit(1)
          .maybeSingle();
        let nextDisplayOrder = (lastProduct?.display_order ?? 0) + 1;

        const rowsWithPayload = rowsToInsert.map((row) => ({
          row,
          payloadItem: {
            id: randomUUID(),
            tenant_id: tenant.id,
            category_id: row.newProduct.categoryId!,
            sku_code: row.newProduct.skuCode,
            product_name: row.newProduct.productName,
            image_url: row.newProduct.imageUrl ?? null,
            currency: "TRY",
            is_in_stock: true,
            display_order: nextDisplayOrder++,
          },
        }));

        const masterCatalogCandidates: Array<{
          sku_code: string;
          product_name: string;
          category_name: string;
          image_url: string;
        }> = [];

        for (const chunk of chunkArray(rowsWithPayload, UPSERT_CHUNK_SIZE)) {
          // Aynı barkod aynı anda başka bir yoldan da eklenmiş olabilir
          // (yarış durumu, ya da dosyada zaten var olan bir sku_code'a denk
          // gelmesi) — böyle bir çakışma sessizce atlanır, hata verilmez.
          const { data: inserted } = await supabase
            .from("products")
            .upsert(
              chunk.map((entry) => entry.payloadItem),
              { onConflict: "tenant_id,sku_code", ignoreDuplicates: true },
            )
            .select("id");

          const insertedIds = new Set((inserted ?? []).map((row) => row.id as string));

          for (const entry of chunk) {
            if (!insertedIds.has(entry.payloadItem.id)) continue;
            createdProductRows.push({ ...entry.row, productId: entry.payloadItem.id });

            // Master Katalog'a sadece görseli olan (bkz. schema: image_url
            // not null) ve kendi Storage'ımıza yüklenmiş (upload-image
            // endpoint'i üzerinden — dış CDN hotlink değil) ürünler eklenir;
            // diğer tenant'lar da bu ürünü katalogda bulup aktarabilsin.
            if (entry.payloadItem.image_url) {
              masterCatalogCandidates.push({
                sku_code: normalizeCode(entry.payloadItem.sku_code),
                product_name: entry.payloadItem.product_name,
                category_name: categoryNameById.get(entry.payloadItem.category_id) ?? "Diğer",
                image_url: entry.payloadItem.image_url,
              });
            }
          }
        }

        addedToMasterCatalogCount += await contributeToMasterCatalog(supabase, masterCatalogCandidates);
      }
    }
  }

  // productId'si olan satırlarla, Master Katalog'dan yeni aktarılıp artık
  // productId kazanan satırları ve yeni oluşturulan ürünleri aynı listede
  // topluyoruz — geri kalan akış (stok aç, fiyat yaz, sku_code onar) hepsi
  // için ortak.
  const resolvedUpdates: StockImportApplyRowInput[] = [...createdProductRows];
  let skippedImportFailedCount = 0;

  for (const update of parsed.data.updates) {
    if (update.productId) {
      resolvedUpdates.push(update);
      continue;
    }
    if (update.masterCatalogSkuCode) {
      const productId = importedProductIdBySku.get(update.masterCatalogSkuCode);
      if (productId) {
        resolvedUpdates.push({ ...update, productId, barcode: update.barcode ?? update.masterCatalogSkuCode });
      } else {
        skippedImportFailedCount += 1;
      }
    }
  }

  // Aynı ürüne iki farklı satır eşleştirilmiş olabilir (ör. aynı barkod
  // dosyada iki kez geçtiyse) — upsert'te aynı çakışma anahtarını iki kez
  // göndermek Postgres hatası verir, bu yüzden son satır kazanır.
  const dedupedByProductId = new Map<string, StockImportApplyRowInput>();
  for (const update of resolvedUpdates) {
    dedupedByProductId.set(update.productId!, update);
  }

  // product_prices tablosunda tenant_id yok ve admin client RLS'i bypass
  // ediyor — bu yüzden productId/priceListId'nin gerçekten bu tenant'a ait
  // olduğu burada ayrıca doğrulanıyor; ait olmayanlar sessizce atlanıyor.
  // Az önce Master Katalog'dan aktarılan ürünler de tenant'ın kendi
  // products tablosuna yazıldığı için bu sorguda otomatik olarak yer alır.
  const [tenantProductIds, tenantPriceLists] = await Promise.all([
    fetchAllTenantProductIds(supabase, tenant.id),
    getTenantPriceLists(tenant.id),
  ]);
  const tenantProductIdSet = new Set(tenantProductIds);
  const tenantPriceListIdSet = new Set(tenantPriceLists.map((list) => list.id));

  const validUpdates = [...dedupedByProductId.values()].filter(
    (update) => tenantProductIdSet.has(update.productId!) && tenantPriceListIdSet.has(update.priceListId),
  );
  const skippedInvalidCount = dedupedByProductId.size - validUpdates.length;

  if (!validUpdates.length) {
    return NextResponse.json(
      { error: "Uygulanacak geçerli satır kalmadı." },
      { status: 400 },
    );
  }

  const validProductIds = validUpdates.map((update) => update.productId!);

  for (const idsChunk of chunkArray(validProductIds, ID_CHUNK_SIZE)) {
    const { error: stockError } = await supabase
      .from("products")
      .update({ is_in_stock: true })
      .eq("tenant_id", tenant.id)
      .in("id", idsChunk);

    if (stockError) {
      return NextResponse.json({ error: stockError.message }, { status: 400 });
    }
  }

  const priceRows = validUpdates.map((update) => ({
    product_id: update.productId!,
    price_list_id: update.priceListId,
    price: update.price,
  }));

  for (const batch of chunkArray(priceRows, UPSERT_CHUNK_SIZE)) {
    const { error: priceError } = await supabase
      .from("product_prices")
      .upsert(batch, { onConflict: "product_id,price_list_id" });

    if (priceError) {
      return NextResponse.json({ error: priceError.message }, { status: 400 });
    }
  }

  // Ürün barkodla değil isimle/manuel eşleştirildiyse (ör. mevcut ürünün
  // sku_code'u gerçek barkod değil de başka bir kaynaktan gelen kod ise —
  // bkz. market katalog crawler'ının sku_code'u görsel URL'sinden türetmesi),
  // burada ürünün sku_code'unu dosyadaki gerçek barkoda düzeltiyoruz. Böylece
  // bir sonraki stok listesi yüklemesinde bu ürün doğrudan barkodla (tier 1)
  // eşleşir, tekrar isimle uğraşmaya gerek kalmaz — kendi kendini onaran bir
  // döngü. Aynı barkodu tenant içinde başka bir ürün zaten kullanıyorsa
  // (unique(tenant_id, sku_code) çakışması) o satır sessizce atlanır.
  const barcodeByProductId = new Map<string, string>();
  for (const update of validUpdates) {
    if (update.barcode) {
      barcodeByProductId.set(update.productId!, normalizeCode(update.barcode));
    }
  }

  if (barcodeByProductId.size) {
    const productIdsNeedingCheck = [...barcodeByProductId.keys()];
    const currentSkuByProductId = new Map<string, string>();
    // sku_code düzeltilen ürünler aşağıda (bkz. skuUpdates sonrası)
    // görselliyse Master Katalog'a da katkı olarak eklenir — bunun için
    // ürün adı/görsel/kategori burada aynı sorguya alınıyor, ayrı bir
    // round-trip'e gerek kalmıyor.
    const productDetailsById = new Map<
      string,
      { productName: string; imageUrl: string | null; categoryId: string }
    >();

    for (const idsChunk of chunkArray(productIdsNeedingCheck, ID_CHUNK_SIZE)) {
      const { data } = await supabase
        .from("products")
        .select("id, sku_code, product_name, image_url, category_id")
        .eq("tenant_id", tenant.id)
        .in("id", idsChunk);

      for (const row of data ?? []) {
        currentSkuByProductId.set(row.id as string, row.sku_code as string);
        productDetailsById.set(row.id as string, {
          productName: row.product_name as string,
          imageUrl: row.image_url as string | null,
          categoryId: row.category_id as string,
        });
      }
    }

    const candidateBarcodes = [...new Set(barcodeByProductId.values())];
    const ownerProductIdByBarcode = new Map<string, string>();

    for (const batch of chunkArray(candidateBarcodes, ID_CHUNK_SIZE)) {
      const { data } = await supabase
        .from("products")
        .select("id, sku_code")
        .eq("tenant_id", tenant.id)
        .in("sku_code", batch);

      for (const row of data ?? []) {
        ownerProductIdByBarcode.set(row.sku_code as string, row.id as string);
      }
    }

    const skuUpdates = [...barcodeByProductId.entries()].filter(([productId, barcode]) => {
      if (currentSkuByProductId.get(productId) === barcode) {
        return false;
      }
      const owner = ownerProductIdByBarcode.get(barcode);
      return !owner || owner === productId;
    });

    for (const chunk of chunkArray(skuUpdates, SKU_REPAIR_CONCURRENCY)) {
      await Promise.all(
        chunk.map(([productId, barcode]) =>
          supabase
            .from("products")
            .update({ sku_code: barcode })
            .eq("id", productId)
            .eq("tenant_id", tenant.id),
        ),
      );
    }

    // Barkodu az önce düzeltilen (isimle/manuel eşleştirilmiş) ürünler —
    // tenant'ta zaten görseliyle var olduklarına göre, bir sonraki tenant
    // aynı barkodu yüklediğinde artık Master Katalog'dan barkodla (tier 1)
    // otomatik eşleşsin diye buraya da katkı olarak eklenir. Sadece "yeni
    // ürün oluştur" akışında değil, mevcut ürünle eşleştirmede de aynı
    // kural: yalnızca gerçek (kendi Storage'ımıza yüklenmiş) görseli
    // olanlar eklenir.
    const matchedCandidateDetails = skuUpdates
      .map(([productId, barcode]) => ({ barcode, details: productDetailsById.get(productId) }))
      .filter(
        (entry): entry is { barcode: string; details: { productName: string; imageUrl: string; categoryId: string } } =>
          Boolean(entry.details?.imageUrl),
      );

    if (matchedCandidateDetails.length) {
      const uniqueCategoryIds = [...new Set(matchedCandidateDetails.map((entry) => entry.details.categoryId))];
      const { data: categoryRowsForMatch } = await supabase
        .from("categories")
        .select("id, name")
        .in("id", uniqueCategoryIds);
      const categoryNameByIdForMatch = new Map(
        (categoryRowsForMatch ?? []).map((row) => [row.id as string, row.name as string]),
      );

      const matchedCandidates = matchedCandidateDetails.map((entry) => ({
        sku_code: entry.barcode,
        product_name: entry.details.productName,
        category_name: categoryNameByIdForMatch.get(entry.details.categoryId) ?? "Diğer",
        image_url: entry.details.imageUrl,
      }));

      addedToMasterCatalogCount += await contributeToMasterCatalog(supabase, matchedCandidates);
    }
  }

  const updatedProducts: Array<Record<string, unknown>> = [];
  for (const idsChunk of chunkArray(validProductIds, ID_CHUNK_SIZE)) {
    const { data, error: fetchError } = await supabase
      .from("products")
      .select(productWithVariantsAndPricesSelect)
      .eq("tenant_id", tenant.id)
      .in("id", idsChunk);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 400 });
    }

    updatedProducts.push(...((data as Array<Record<string, unknown>> | null) ?? []));
  }

  if (importedProductIdBySku.size || createdProductRows.length) {
    revalidateStorefrontCache({ tenantId: tenant.id, subdomain: tenant.subdomain });
  }

  return NextResponse.json({
    updatedCount: validUpdates.length,
    skippedInvalidCount,
    importedFromMasterCatalogCount: importedProductIdBySku.size,
    skippedForCatalogLimitCount,
    skippedImportFailedCount,
    createdProductCount: createdProductRows.length,
    skippedInvalidCategoryCount,
    skippedForNewProductLimitCount,
    addedToMasterCatalogCount,
    updatedProducts: updatedProducts.map((product) => normalizeProductRecord(product)),
  });
}
