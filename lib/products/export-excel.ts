import * as XLSX from "xlsx";
import { getTenantCategories, getTenantPriceLists, getTenantProductsPage, TENANT_PRODUCTS_PAGE_SIZE } from "@/lib/data";
import type { ProductQualityFilter, ProductStockFilter } from "@/lib/products/constants";
import type { Product } from "@/lib/types";

// Ürünler sayfası → "Excel olarak dışa aktar" (7 Eki 2026, Nailport isteği).
// Sütunlar Toplu İşlemler içe aktarmasının tanıdığı başlıklardır; müşteri fiyatı
// değiştirip AYNI dosyayı geri yükleyince ürünler güncellenir. Fiyatlar her liste
// için "Fiyat: <liste adı>" sütununda (lib/csv/parse-spreadsheet dinamik sütun).
// İçe aktarma açıklama/görsel/indirim/sıraya dokunmaz (bkz. products/import route).
const MAX_PRODUCTS = 20_000;

export interface ProductsExcelParams {
  tenant: { id: string; company_name: string };
  search?: string;
  categoryIds?: string[];
  matchCategoryIds?: string[];
  stockFilter?: ProductStockFilter;
  qualityFilter?: ProductQualityFilter;
}

function safeFileName(name: string) {
  return (
    name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/ı/g, "i")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "magaza"
  );
}

export async function buildProductsExcel(
  params: ProductsExcelParams,
): Promise<{ error: string } | { buffer: Buffer; fileName: string }> {
  const { tenant, search, categoryIds, matchCategoryIds, stockFilter, qualityFilter } = params;
  const [categories, priceLists] = await Promise.all([
    getTenantCategories(tenant.id),
    getTenantPriceLists(tenant.id),
  ]);

  const products: Product[] = [];
  for (let page = 1; products.length < MAX_PRODUCTS; page += 1) {
    const result = await getTenantProductsPage({
      tenantId: tenant.id,
      page,
      search,
      categoryIds,
      matchCategoryIds,
      stockFilter,
      qualityFilter,
    });
    products.push(...result.products);
    if (result.products.length < TENANT_PRODUCTS_PAGE_SIZE || products.length >= result.total) break;
  }
  if (!products.length) {
    return { error: "Dışa aktarılacak ürün bulunamadı." };
  }

  const categoryName = new Map(categories.map((category) => [category.id, category.name]));
  const pricedLists = priceLists
    .filter((list) => !list.is_catalog_only)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const header = [
    "Kategori Adı",
    "Model No",
    "Ürün Adı",
    "Marka",
    "Para Birimi",
    ...pricedLists.map((list) => `Fiyat: ${list.name}`),
    "Stok Durumu",
    "Paket Adedi",
    "Koli Adedi",
  ];
  const rows = products.map((product) => [
    categoryName.get(product.category_id) ?? "",
    product.sku_code ?? "",
    product.product_name,
    product.brand ?? "",
    product.currency ?? "TRY",
    ...pricedLists.map((list) => {
      const entry = product.prices?.find((price) => price.price_list_id === list.id);
      const value = entry ? Number(entry.price) : NaN;
      return Number.isFinite(value) && value > 0 ? value : "";
    }),
    product.is_in_stock ? "Var" : "Yok",
    product.package_quantity ?? "",
    product.carton_quantity ?? "",
  ]);

  const sheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
  sheet["!cols"] = header.map((title) =>
    title === "Ürün Adı" ? { wch: 48 } : title === "Kategori Adı" ? { wch: 26 } : { wch: Math.max(14, title.length + 2) },
  );
  sheet["!freeze"] = { xSplit: 0, ySplit: 1 };

  const guide = XLSX.utils.aoa_to_sheet([
    ["Fiyat güncelleme nasıl yapılır?"],
    [""],
    ['1. "Ürünler" sayfasındaki fiyat sütunlarını (Fiyat: …) değiştirin. Stok Durumu için "Var" veya "Yok" yazın.'],
    ['2. "Model No" sütununu DEĞİŞTİRMEYİN: ürünler bu kodla eşleşir. Satır silmek ürünü silmez.'],
    ['3. Sütun adlarını değiştirmeyin; dosyayı .xlsx olarak kaydedin.'],
    ['4. Panelde Ürünler → Toplu İşlemler → Excel yükle bölümünden dosyayı yükleyin.'],
    [""],
    ["Ürün açıklamaları, görseller ve indirimli fiyatlar bu dosyayla değişmez; yalnız ad, kategori, fiyat, stok ve paket/koli adedi güncellenir."],
    ["Yeni Model No ile eklenen satırlar yeni ürün olarak eklenir."],
  ]);
  guide["!cols"] = [{ wch: 110 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Ürünler");
  XLSX.utils.book_append_sheet(workbook, guide, "Nasıl Kullanılır");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;

  const date = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Istanbul" }).format(new Date());
  return { buffer, fileName: `${safeFileName(tenant.company_name)}-urunler-${date}.xlsx` };
}
