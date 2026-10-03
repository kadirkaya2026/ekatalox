import sharp from "sharp";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getTenantCategories, getTenantPriceLists, getTenantProductsPage, TENANT_PRODUCTS_PAGE_SIZE } from "@/lib/data";
import { getPriceListDisplayName } from "@/lib/price-lists/constants";
import type { ProductQualityFilter, ProductStockFilter } from "@/lib/products/constants";
import { registerRobotoFonts } from "@/lib/storefront/pdf-fonts";
import type { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

// Ürünler sayfası → "PDF olarak dışa aktar" — PDF üretimi (route: app/api/tenant/products/export-pdf) (3 Eki 2026). Paneldeki listeyle
// aynı filtre (arama, kategori, stok, eksik görsel/fiyat) ve aynı sırayla;
// fiyat listesini kullanıcı seçer, "none" = fiyatsız. Görseller küçük kareye
// indirilip gömülür (fiş PDF'iyle aynı yöntem, lib/storefront/receipt-images.ts).
const MAX_PRODUCTS = 5000;
const THUMB_PX = 140;
const IMAGE_MM = 14;
const FETCH_TIMEOUT_MS = 5000;
const IMAGE_CONCURRENCY = 12;

async function toThumbDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!response.ok) return null;
    const input = Buffer.from(await response.arrayBuffer());
    const output = await sharp(input)
      .rotate()
      .resize(THUMB_PX, THUMB_PX, { fit: "contain", background: "#ffffff" })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 72 })
      .toBuffer();
    return `data:image/jpeg;base64,${output.toString("base64")}`;
  } catch {
    return null;
  }
}

async function loadThumbs(urls: string[]): Promise<Map<string, string | null>> {
  const unique = [...new Set(urls)];
  const thumbs = new Map<string, string | null>();
  for (let i = 0; i < unique.length; i += IMAGE_CONCURRENCY) {
    const batch = unique.slice(i, i + IMAGE_CONCURRENCY);
    const results = await Promise.all(batch.map(toThumbDataUrl));
    batch.forEach((url, index) => thumbs.set(url, results[index]));
  }
  return thumbs;
}

function safeFileName(value: string) {
  return value
    .replace(/ı/g, "i")
    .replace(/İ/g, "I")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export interface ProductsPdfParams {
  tenant: { id: string; company_name: string };
  priceListParam: string; // fiyat listesi id'si ya da "none"
  search?: string;
  categoryIds?: string[];
  matchCategoryIds?: string[];
  stockFilter?: ProductStockFilter;
  qualityFilter?: ProductQualityFilter;
}

export async function buildProductsPdf(params: ProductsPdfParams): Promise<{ error: string } | { buffer: Buffer; fileName: string }> {
  const { tenant, priceListParam, search, categoryIds, matchCategoryIds, stockFilter, qualityFilter } = params;
  const [categories, priceLists] = await Promise.all([
    getTenantCategories(tenant.id),
    getTenantPriceLists(tenant.id),
  ]);
  const priceList = priceListParam === "none" ? null : priceLists.find((list) => list.id === priceListParam) ?? null;
  if (priceListParam !== "none" && (!priceList || priceList.is_catalog_only)) {
    return { error: "Fiyat listesi bulunamadı." };
  }

  // Panel listesiyle aynı sorgu, sayfa sayfa (her sayfa 100 ürün).
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
  const thumbs = await loadThumbs(products.map((product) => product.image_url).filter(Boolean) as string[]);

  const priceText = (product: Product) => {
    if (!priceList) return "";
    const entry = product.prices?.find((price) => price.price_list_id === priceList.id);
    if (!entry || !Number.isFinite(Number(entry.price)) || Number(entry.price) <= 0) return "—";
    const base = formatCurrency(Number(entry.price), product.currency);
    const discount = entry.discount_price != null && Number(entry.discount_price) > 0 ? Number(entry.discount_price) : null;
    return discount ? `${formatCurrency(discount, product.currency)}\n(${base})` : base;
  };

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  registerRobotoFonts(doc);
  doc.setFont("Roboto", "normal");

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const today = new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeZone: "Europe/Istanbul" }).format(new Date());
  const listLabel = priceList ? getPriceListDisplayName(priceList) : "Fiyatsız";

  doc.setFont("Roboto", "bold");
  doc.setFontSize(16);
  doc.text(tenant.company_name, margin, 16);
  doc.setFont("Roboto", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(100);
  doc.text(`Ürün listesi · ${listLabel} · ${products.length} ürün · ${today}`, margin, 22);
  doc.setTextColor(0);

  const head = [["", "Kod", "Ürün", "Kategori", "Koli", "Stok", ...(priceList ? ["Fiyat"] : [])]];
  const body = products.map((product) => [
    "",
    product.sku_code ?? "",
    product.product_name,
    categoryName.get(product.category_id) ?? "",
    product.carton_quantity ? String(product.carton_quantity) : "",
    product.is_in_stock ? "Var" : "Yok",
    ...(priceList ? [priceText(product)] : []),
  ]);

  autoTable(doc, {
    startY: 27,
    margin: { left: margin, right: margin, top: 14, bottom: 14 },
    head,
    body,
    theme: "grid",
    rowPageBreak: "avoid",
    styles: { font: "Roboto", fontSize: 8, cellPadding: 1.8, valign: "middle", lineColor: [226, 232, 240], lineWidth: 0.2 },
    headStyles: { font: "Roboto", fontStyle: "bold", fillColor: [241, 245, 249], textColor: [51, 65, 85] },
    columnStyles: {
      0: { cellWidth: IMAGE_MM + 3, minCellHeight: IMAGE_MM + 3 },
      1: { cellWidth: 24 },
      3: { cellWidth: 32 },
      4: { cellWidth: 12, halign: "right" },
      5: { cellWidth: 12, halign: "center" },
      ...(priceList ? { 6: { cellWidth: 24, halign: "right" as const, fontStyle: "bold" as const } } : {}),
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 5 && data.cell.raw === "Yok") {
        data.cell.styles.textColor = [190, 18, 60];
      }
    },
    didDrawCell: (data) => {
      if (data.section !== "body" || data.column.index !== 0) return;
      const imageUrl = products[data.row.index]?.image_url;
      const image = imageUrl ? thumbs.get(imageUrl) : null;
      if (!image) return;
      try {
        doc.addImage(image, "JPEG", data.cell.x + 1.5, data.cell.y + (data.cell.height - IMAGE_MM) / 2, IMAGE_MM, IMAGE_MM);
      } catch {
        // Bozuk görsel dosyayı düşürmesin.
      }
    },
    didDrawPage: () => {
      doc.setFont("Roboto", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(140);
      doc.text(`${tenant.company_name} · ${listLabel}`, margin, pageHeight - 7);
      doc.text(`Sayfa ${doc.getNumberOfPages()}`, pageWidth - margin, pageHeight - 7, { align: "right" });
      doc.setTextColor(0);
    },
  });

  const buffer = Buffer.from(doc.output("arraybuffer"));
  const fileName = `${safeFileName(tenant.company_name) || "urunler"}-urun-listesi-${safeFileName(listLabel)}.pdf`;
  return { buffer, fileName };
}
