import { writeFile } from "node:fs/promises";
import * as XLSX from "xlsx";

const BASE_URL = "https://lucatech.com.tr";
const CATEGORY_SITEMAP_URL = `${BASE_URL}/wp-sitemap-taxonomies-product_cat-1.xml`;
const PRODUCT_SITEMAP_URL = `${BASE_URL}/wp-sitemap-posts-product-1.xml`;
const OUTPUT_XLSX_PATH = "lucatech-urunleri.xlsx";
const OUTPUT_REPORT_PATH = "lucatech-urunleri-rapor.json";
const MAX_CATEGORY_PAGES = 20;

const REQUEST_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
  Referer: BASE_URL,
};

function decodeHtml(value) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCharCode(Number.parseInt(code, 16)),
    )
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&ndash;/g, "-")
    .replace(/&mdash;/g, "-")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function normalizeText(value) {
  return decodeHtml(value.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSku(value) {
  return normalizeText(value)
    .replace(/^SKU:\s*/i, "")
    .replace(/\s+/g, "")
    .toUpperCase();
}

function extractLocs(xmlText) {
  return [...xmlText.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) =>
    decodeHtml(match[1]).trim(),
  );
}

function slugToTitle(url) {
  const slug = url.split("/").filter(Boolean).pop() ?? "";
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toLocaleUpperCase("tr-TR"));
}

function extractCategoryName(html, fallbackUrl) {
  const breadcrumbMatch = html.match(
    /<nav class="woocommerce-breadcrumb"[\s\S]*?<\/span>\s*([^<]+)<\/nav>/i,
  );

  if (breadcrumbMatch?.[1]) {
    return normalizeText(breadcrumbMatch[1]);
  }

  const titleMatch = html.match(/<title>(.*?)<\/title>/i);

  if (titleMatch?.[1]) {
    return normalizeText(titleMatch[1]).replace(/\s+[–-]\s+Lucatech$/i, "");
  }

  return slugToTitle(fallbackUrl);
}

function extractSkuFromText(value) {
  const normalized = normalizeText(value).toUpperCase();
  const patterns = [
    /\b([A-Z]{1,5}-\d{2,5}[A-Z]?)\b/,
    /\b([A-Z]{1,5}-\d{1,3}-\d{1,3})\b/,
    /\b([A-Z]{1,5}\d{2,5}[A-Z]?)\b/,
    /\b([A-Z]{1,5}-[A-Z0-9]{2,8})\b/,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);

    if (match?.[1]) {
      return match[1];
    }
  }

  return "";
}

function extractSkuFromUrl(url) {
  const slug = url.split("/").filter(Boolean).pop() ?? "";
  const normalized = slug.replace(/-/g, " ").toUpperCase();
  return extractSkuFromText(normalized);
}

function dedupeByUrl(products) {
  const productMap = new Map();

  for (const product of products) {
    if (!productMap.has(product.url)) {
      productMap.set(product.url, product);
      continue;
    }

    const existing = productMap.get(product.url);

    if (!existing.sku && product.sku) {
      productMap.set(product.url, product);
    }
  }

  return [...productMap.values()];
}

function extractProductsFromCategoryHtml(html, categoryName) {
  const productRegex =
    /<a href="(https:\/\/lucatech\.com\.tr\/urun\/[^"]+)"[^>]*data-product_sku="([^"]*)"[^>]*data-product_name="([^"]+)"[^>]*>/g;

  const products = [];

  for (const match of html.matchAll(productRegex)) {
    const url = decodeHtml(match[1]).trim();
    const pageSku = normalizeSku(match[2]);
    const productName = normalizeText(match[3]);
    const sku = pageSku || extractSkuFromText(productName) || extractSkuFromUrl(url);

    products.push({
      categoryName,
      sku,
      productName,
      url,
      skuSource: pageSku
        ? "page"
        : sku
          ? "derived"
          : "missing",
    });
  }

  return dedupeByUrl(products);
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: REQUEST_HEADERS,
    redirect: "follow",
    signal: AbortSignal.timeout(30_000),
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} → ${url}`);
  }

  return {
    text,
    finalUrl: response.url,
    status: response.status,
  };
}

async function scrapeCategory(categoryUrl) {
  const collected = [];
  const seenUrls = new Set();
  const baseCategoryUrl = categoryUrl.replace(/\/$/, "");
  let resolvedCategoryName = "";

  for (let page = 1; page <= MAX_CATEGORY_PAGES; page += 1) {
    const pageUrl =
      page === 1 ? categoryUrl : `${baseCategoryUrl}/page/${page}/`;
    let pageResult;

    try {
      pageResult = await fetchText(pageUrl);
    } catch (error) {
      if (
        page > 1 &&
        error instanceof Error &&
        error.message.includes("404 Not Found")
      ) {
        break;
      }

      throw error;
    }

    const { text, finalUrl } = pageResult;
    const normalizedFinalUrl = finalUrl.replace(/\/$/, "");

    if (page > 1 && normalizedFinalUrl === baseCategoryUrl) {
      break;
    }

    const categoryName = extractCategoryName(text, categoryUrl);
    resolvedCategoryName = resolvedCategoryName || categoryName;
    const pageProducts = extractProductsFromCategoryHtml(text, categoryName);

    if (!pageProducts.length) {
      break;
    }

    let addedCount = 0;

    for (const product of pageProducts) {
      if (seenUrls.has(product.url)) {
        continue;
      }

      seenUrls.add(product.url);
      collected.push(product);
      addedCount += 1;
    }

    if (addedCount === 0) {
      break;
    }
  }

  return {
    categoryName: resolvedCategoryName || slugToTitle(categoryUrl),
    products: collected,
  };
}

function buildWorkbookRows(products) {
  return products.map((product) => ({
    "Kategori Adı": product.categoryName,
    "Stok Kodu (SKU)": product.sku,
    "Ürün Adı": product.productName,
  }));
}

function sortProducts(products) {
  return [...products].sort((left, right) => {
    const categoryCompare = left.categoryName.localeCompare(right.categoryName, "tr");

    if (categoryCompare !== 0) {
      return categoryCompare;
    }

    const skuCompare = left.sku.localeCompare(right.sku, "en");

    if (skuCompare !== 0) {
      return skuCompare;
    }

    return left.productName.localeCompare(right.productName, "tr");
  });
}

async function main() {
  console.log("Lucatech kategori haritası okunuyor...");
  const categorySitemap = await fetchText(CATEGORY_SITEMAP_URL);
  const categoryUrls = extractLocs(categorySitemap.text).filter((url) =>
    url.startsWith(`${BASE_URL}/product-category/`),
  );

  const scrapedProducts = [];

  for (const categoryUrl of categoryUrls) {
    console.log(`Kategori taranıyor: ${categoryUrl}`);
    const categoryResult = await scrapeCategory(categoryUrl);
    console.log(
      `→ ${categoryResult.categoryName}: ${categoryResult.products.length} ürün`,
    );
    scrapedProducts.push(...categoryResult.products);
  }

  const uniqueByUrl = new Map();

  for (const product of scrapedProducts) {
    if (!uniqueByUrl.has(product.url)) {
      uniqueByUrl.set(product.url, product);
      continue;
    }

    const existing = uniqueByUrl.get(product.url);

    if (!existing.sku && product.sku) {
      uniqueByUrl.set(product.url, product);
    }
  }

  const products = sortProducts([...uniqueByUrl.values()]);
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(buildWorkbookRows(products), {
    header: ["Kategori Adı", "Stok Kodu (SKU)", "Ürün Adı"],
  });

  worksheet["!cols"] = [{ wch: 24 }, { wch: 20 }, { wch: 72 }];

  XLSX.utils.book_append_sheet(workbook, worksheet, "Ürünler");
  XLSX.writeFile(workbook, OUTPUT_XLSX_PATH);

  const productSitemap = await fetchText(PRODUCT_SITEMAP_URL);
  const sitemapProductUrls = extractLocs(productSitemap.text).filter((url) =>
    url.startsWith(`${BASE_URL}/urun/`),
  );
  const foundProductUrlSet = new Set(products.map((product) => product.url));

  const missingSkuProducts = products.filter((product) => !product.sku);
  const uncapturedSitemapProducts = sitemapProductUrls.filter(
    (url) => !foundProductUrlSet.has(url),
  );

  const report = {
    createdAt: new Date().toISOString(),
    categoryCount: categoryUrls.length,
    totalScrapedRows: scrapedProducts.length,
    uniqueProductCount: products.length,
    sitemapProductCount: sitemapProductUrls.length,
    missingSkuCount: missingSkuProducts.length,
    uncapturedSitemapCount: uncapturedSitemapProducts.length,
    missingSkuProducts,
    uncapturedSitemapProducts,
  };

  await writeFile(OUTPUT_REPORT_PATH, JSON.stringify(report, null, 2), "utf8");

  console.log(`Excel oluşturuldu: ${OUTPUT_XLSX_PATH}`);
  console.log(`Rapor oluşturuldu: ${OUTPUT_REPORT_PATH}`);
  console.log(`Toplam benzersiz ürün: ${products.length}`);

  if (missingSkuProducts.length > 0) {
    console.log(`SKU bulunamayan ürün sayısı: ${missingSkuProducts.length}`);
  }

  if (uncapturedSitemapProducts.length > 0) {
    console.log(
      `Kategori sayfalarında bulunamayan sitemap ürünü: ${uncapturedSitemapProducts.length}`,
    );
  }
}

main().catch((error) => {
  console.error("Lucatech export işlemi başarısız oldu.");
  console.error(error);
  process.exitCode = 1;
});