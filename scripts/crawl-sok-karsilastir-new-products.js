// marketkarsilastir.com'un ŞOK-filtreli sayfalarından (marketler/sok?page=N)
// barkod+isim+fiyat+kategori bilgisini çekip, her ürün için ŞOK'un kendi
// sitesindeki (specific_market_url) ürün sayfasından GERÇEK görseli alarak
// Master Katalog'a YENİ satırlar (source='sok_karsilastir') olarak ekler.
//
// marketkarsilastir.com kendisi görsel barındırmıyor (image alanı hep null),
// bu yüzden köprüleme yapıyoruz: barkod+isim marketkarsilastir'dan, görsel
// ŞOK'un kendi ürün sayfasının Next.js RSC payload'ındaki gömülü
// "product":{"id":...,"images":[{"host":...,"path":...}]} alanından.
//
// market_catalog_products şeması (0056_market_catalog.sql):
//   source, sku_code, product_name, brand, category_name, image_url
//   unique (source, sku_code) — ama barkod ÇAKIŞMASI herhangi bir source'ta
//   varsa bu script o barkodu atlar (aynı ürünü iki kez eklememek için).
//
// Kullanım:
//   node scripts/crawl-sok-karsilastir-new-products.js            (dry-run, sadece tarar+örnek gösterir)
//   node scripts/crawl-sok-karsilastir-new-products.js --apply    (canlıya yazar)

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const PROJECT_ROOT = path.join(__dirname, "..");
const NEW_SOURCE = "sok_karsilastir";
const LIST_MAX_PAGE = 11; // doğrulandı: page 12+ boş
const CATALOG_PAGE_SIZE = 1000;
const LOOKUP_CHUNK_SIZE = 60;
const INSERT_CHUNK_SIZE = 100;
const LIST_REQUEST_DELAY_MS = 350;
const PRODUCT_REQUEST_DELAY_MS = 300;
const PRODUCT_FETCH_CONCURRENCY = 5;

function loadDotEnvLocal() {
  const fileName = process.env.USE_PROD_ENV === "1" ? path.join(".vercel", ".env.production.local") : ".env.local";
  const envPath = path.join(PROJECT_ROOT, fileName);
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY ortam değişkenleri gerekli.");
  }
  return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}

function chunkArray(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isValidEanUpc(code) {
  if (!/^\d{8}$|^\d{12,14}$/.test(code)) return false;
  const digits = code.split("").map(Number);
  const check = digits.pop();
  let sum = 0;
  const len = digits.length;
  for (let i = 0; i < len; i++) {
    const posFromRight = len - i;
    sum += digits[i] * (posFromRight % 2 === 1 ? 3 : 1);
  }
  return (10 - (sum % 10)) % 10 === check;
}

async function fetchSokKarsilastirList() {
  const byBarcode = new Map();
  for (let page = 0; page <= LIST_MAX_PAGE; page++) {
    const res = await fetch(`https://marketkarsilastir.com/marketler/sok?page=${page}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const html = await res.text();
    const matches = [...html.matchAll(/data-product-data="([^"]*)"/g)];
    for (const m of matches) {
      const decoded = m[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&");
      let obj;
      try {
        obj = JSON.parse(decoded);
      } catch {
        continue;
      }
      if (!obj.name || !obj.barcode || !isValidEanUpc(obj.barcode)) continue;
      if (byBarcode.has(obj.barcode)) continue;
      const sokPrice = (obj.prices || []).find((p) => p.market_id === obj.market_id) || null;
      if (!sokPrice || !sokPrice.specific_market_url) continue;
      byBarcode.set(obj.barcode, {
        barcode: obj.barcode,
        name: obj.name,
        brand: obj.brand || null,
        category: obj.category || null,
        price: Number(obj.price) || null,
        specificMarketUrl: sokPrice.specific_market_url,
      });
    }
    console.log(`  sayfa ${page}: ${matches.length} kart, toplam benzersiz barkod: ${byBarcode.size}`);
    await sleep(LIST_REQUEST_DELAY_MS);
  }
  return [...byBarcode.values()];
}

async function fetchExistingBarcodes(supabase) {
  const set = new Set();
  for (let from = 0; ; from += CATALOG_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("market_catalog_products")
      .select("sku_code")
      .range(from, from + CATALOG_PAGE_SIZE - 1);
    if (error) throw error;
    for (const row of data) set.add(row.sku_code.trim().toUpperCase());
    if (data.length < CATALOG_PAGE_SIZE) break;
  }
  return set;
}

async function fetchSokProductImage(url) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return null;
    const html = await res.text();
    // Ana ürün görseli her zaman width=600 preload linki olarak ilk sırada
    // gelir; width=216 olanlar sayfadaki ilgili/çapraz-satış ürünleridir.
    const m = html.match(/<link rel="preload" as="image" href="(https:\/\/images\.ceptesok\.com\/cdn-cgi\/image\/width=600[^"]*product-assets[^"]*)"/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

async function main() {
  loadDotEnvLocal();
  const apply = process.argv.includes("--apply");
  const supabase = getSupabaseClient();

  console.log("[1/4] marketkarsilastir.com (ŞOK filtreli) taranıyor...");
  const entries = await fetchSokKarsilastirList();
  console.log(`  ${entries.length} benzersiz barkod bulundu.`);

  console.log("[2/4] mevcut market_catalog_products barkodları okunuyor (çakışma kontrolü)...");
  const existingBarcodes = await fetchExistingBarcodes(supabase);
  console.log(`  ${existingBarcodes.size} mevcut barkod.`);

  const candidates = entries.filter((e) => !existingBarcodes.has(e.barcode.toUpperCase()));
  console.log(`  ${entries.length - candidates.length} zaten katalogda, ${candidates.length} yeni aday.`);

  console.log("[3/4] her aday için ŞOK ürün sayfasından gerçek görsel çekiliyor...");
  const withImages = [];
  let done = 0;
  for (const chunk of chunkArray(candidates, PRODUCT_FETCH_CONCURRENCY)) {
    const results = await Promise.all(
      chunk.map(async (c) => {
        const imageUrl = await fetchSokProductImage(c.specificMarketUrl);
        return { ...c, imageUrl };
      }),
    );
    for (const r of results) withImages.push(r);
    done += chunk.length;
    if (done % 40 === 0 || done === candidates.length) {
      console.log(`  ${done}/${candidates.length} tarandı, ${withImages.filter((x) => x.imageUrl).length} görsel bulundu...`);
    }
    await sleep(PRODUCT_REQUEST_DELAY_MS);
  }

  const ready = withImages.filter((x) => x.imageUrl);
  const noImage = withImages.length - ready.length;
  console.log(`  ${ready.length} ürün için görsel bulundu, ${noImage} ürün görselsiz kaldı (atlanacak).`);

  console.log(`[4/4] toplam eklenecek: ${ready.length}`);

  if (!apply) {
    console.log("\nDry-run modundasınız, hiçbir şey yazılmadı. Uygulamak için --apply ekleyin.");
    console.log("\n-- örnekler --");
    for (const r of ready.slice(0, 15)) {
      console.log(`  [${r.category || "Kategorisiz"}] "${r.name}" (${r.barcode}) ${r.price ?? "?"}TL -> ${r.imageUrl}`);
    }
    return;
  }

  const rows = ready.map((r) => ({
    source: NEW_SOURCE,
    sku_code: r.barcode,
    product_name: r.name,
    brand: r.brand,
    category_name: r.category || "Kategorisiz",
    image_url: r.imageUrl,
  }));

  let inserted = 0;
  for (const chunk of chunkArray(rows, INSERT_CHUNK_SIZE)) {
    const { error, count } = await supabase
      .from("market_catalog_products")
      .insert(chunk, { count: "exact" });
    if (error) {
      console.error("  chunk hata:", error.message);
      continue;
    }
    inserted += count ?? chunk.length;
  }
  console.log(`  ${inserted}/${rows.length} yeni katalog satırı eklendi.`);
  console.log("\nTamamlandı.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
