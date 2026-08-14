// marketkarsilastir.com'un ŞOK dışındaki market sayfalarından barkod+isim
// çekip, her marketin KENDİ sitesinden gerçek görseli köprüleyerek Master
// Katalog'a yeni satırlar ekler (bkz. crawl-sok-karsilastir-new-products.js
// — aynı yöntemin genelleştirilmiş hali).
//
// marketkarsilastir.com'da 8 market var: migros (isimle eşleştirildi),
// şok (görsel köprülendi), a101, carrefoursa, mopas, metro, file,
// bizim-market. Bu script'te sadece GERÇEKTEN köprülenebilenler var:
//   - mopas: erişilebilir, ürün sayfasında <img id="img_0"> ana görsel
//   - bizim-market: erişilebilir, sayfada Product tipi JSON-LD + image alanı
// Denenip ELENEN'ler (script'e dahil değil):
//   - a101, carrefoursa: Cloudflare bot-koruması (challenge sayfası dönüyor,
//     otomatik erişim engelli — aşmaya çalışılmadı)
//   - metro: data-product-data içindeki specific_market_url her zaman boş
//   - file: specific_market_url hep ana sayfaya (filemarket.com.tr) gidiyor,
//     ürüne özel sayfa linki yok
//
// Kullanım:
//   node scripts/crawl-marketkarsilastir-extra-markets.js            (dry-run)
//   node scripts/crawl-marketkarsilastir-extra-markets.js --apply

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const PROJECT_ROOT = path.join(__dirname, "..");
const CATALOG_PAGE_SIZE = 1000;
const INSERT_CHUNK_SIZE = 100;
const LIST_REQUEST_DELAY_MS = 350;
const PRODUCT_REQUEST_DELAY_MS = 300;
const PRODUCT_FETCH_CONCURRENCY = 5;

const MARKETS = [
  {
    slug: "mopas",
    source: "mopas_karsilastir",
    maxPage: 22,
    async extractImage(html) {
      const m = html.match(/<img id="img_0" src="([^"]+)"/);
      return m ? m[1] : null;
    },
  },
  {
    slug: "bizim-market",
    source: "bizim_market_karsilastir",
    maxPage: 12,
    async extractImage(html) {
      const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
      for (const b of blocks) {
        try {
          const obj = JSON.parse(b[1].trim());
          if (obj["@type"] === "Product" && obj.image) return obj.image;
        } catch {
          // atla
        }
      }
      return null;
    },
  },
];

function loadDotEnvLocal() {
  const envPath = path.join(PROJECT_ROOT, ".env.local");
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

async function fetchMarketList(market) {
  const byBarcode = new Map();
  for (let page = 0; page <= market.maxPage; page++) {
    const res = await fetch(`https://marketkarsilastir.com/marketler/${market.slug}?page=${page}`, {
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
      const ownPrice = (obj.prices || []).find((p) => p.market_id === obj.market_id) || null;
      if (!ownPrice || !ownPrice.specific_market_url) continue;
      byBarcode.set(obj.barcode, {
        barcode: obj.barcode,
        name: obj.name,
        brand: obj.brand || null,
        category: obj.category || null,
        price: Number(obj.price) || null,
        specificMarketUrl: ownPrice.specific_market_url,
      });
    }
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

async function fetchProductImage(url, extractImage) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return null;
    const html = await res.text();
    return await extractImage(html);
  } catch {
    return null;
  }
}

async function processMarket(supabase, market, existingBarcodes) {
  console.log(`\n=== ${market.slug} (source=${market.source}) ===`);
  console.log("[1/3] marketkarsilastir.com taranıyor...");
  const entries = await fetchMarketList(market);
  console.log(`  ${entries.length} benzersiz barkod bulundu.`);

  const candidates = entries.filter((e) => !existingBarcodes.has(e.barcode.toUpperCase()));
  console.log(`  ${entries.length - candidates.length} zaten katalogda, ${candidates.length} yeni aday.`);

  console.log("[2/3] her aday için kendi sitesinden gerçek görsel çekiliyor...");
  const withImages = [];
  let done = 0;
  for (const chunk of chunkArray(candidates, PRODUCT_FETCH_CONCURRENCY)) {
    const results = await Promise.all(
      chunk.map(async (c) => {
        const imageUrl = await fetchProductImage(c.specificMarketUrl, market.extractImage);
        return { ...c, imageUrl };
      }),
    );
    withImages.push(...results);
    done += chunk.length;
    if (done % 60 === 0 || done === candidates.length) {
      console.log(`  ${done}/${candidates.length} tarandı, ${withImages.filter((x) => x.imageUrl).length} görsel bulundu...`);
    }
    await sleep(PRODUCT_REQUEST_DELAY_MS);
  }

  const ready = withImages.filter((x) => x.imageUrl);
  console.log(`  ${ready.length} ürün için görsel bulundu, ${withImages.length - ready.length} görselsiz kaldı (atlanacak).`);
  return ready;
}

async function main() {
  loadDotEnvLocal();
  const apply = process.argv.includes("--apply");
  const supabase = getSupabaseClient();

  console.log("mevcut market_catalog_products barkodları okunuyor (çakışma kontrolü)...");
  const existingBarcodes = await fetchExistingBarcodes(supabase);
  console.log(`  ${existingBarcodes.size} mevcut barkod.`);

  const allReady = [];
  for (const market of MARKETS) {
    const ready = await processMarket(supabase, market, existingBarcodes);
    for (const r of ready) {
      allReady.push({ ...r, source: market.source });
      existingBarcodes.add(r.barcode.toUpperCase()); // sonraki marketle çakışmayı da önle
    }
  }

  console.log(`\nToplam eklenecek: ${allReady.length}`);

  if (!apply) {
    console.log("\nDry-run modundasınız, hiçbir şey yazılmadı. Uygulamak için --apply ekleyin.");
    console.log("\n-- örnekler --");
    for (const r of allReady.slice(0, 20)) {
      console.log(`  [${r.source}] "${r.name}" (${r.barcode}) ${r.price ?? "?"}TL -> ${r.imageUrl}`);
    }
    return;
  }

  const rows = allReady.map((r) => ({
    source: r.source,
    sku_code: r.barcode,
    product_name: r.name,
    brand: r.brand,
    category_name: r.category || "Kategorisiz",
    image_url: r.imageUrl,
  }));

  console.log("market_catalog_products'a ekleniyor...");
  let inserted = 0;
  for (const chunk of chunkArray(rows, INSERT_CHUNK_SIZE)) {
    const { error, count } = await supabase.from("market_catalog_products").insert(chunk, { count: "exact" });
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
