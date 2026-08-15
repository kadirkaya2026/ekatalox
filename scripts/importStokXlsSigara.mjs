// One-off import: reads the "SİGARALAR" (cigarette) rows out of the user's
// own POS stock export (~/Downloads/STOK.xls — a real inventory file, not a
// crawl), generates a placeholder image with the product's name written on
// it (source has no product photos), uploads those to Supabase Storage, and
// writes the merged result into data/products.json (ready for
// `node scripts/seed-products.js`).
//
// category_name is fixed to "Sigara ve Tütün Ürünleri" — the existing leaf
// category in lib/market-catalog/category-taxonomy.ts that resolves under
// the main "Sigara" category (verified 15 Aug 2026; the sibling
// "Sigara Aksesuarları ve Gereçleri" is for lighters/accessories, not
// tobacco itself, so it's not used here).
//
// Usage:
//   node scripts/importStokXlsSigara.mjs
// (reads SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY from .env.local, same as seed-products.js)

import fs from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import XLSX from "xlsx";
import sharp from "sharp";
import pLimit from "p-limit";

const PROJECT_ROOT = path.join(import.meta.dirname, "..");
const STOK_XLS_PATH = path.join(process.env.HOME, "Downloads/STOK.xls");
const BUCKET = "market-catalog-images";
const SOURCE_NAME = "stok_xls_sigara";
const CATEGORY_NAME = "Sigara ve Tütün Ürünleri";
const UPLOAD_CONCURRENCY = 8;
const IMAGE_SIZE = 800;

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

function parseTlPrice(raw) {
  // "125,00 ₺" -> 125
  const cleaned = (raw || "").toString().replace(/[^\d,.-]/g, "").replace(",", ".");
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? value : null;
}

function escapeXml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function wrapLines(text, maxCharsPerLine, maxLines) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
    if (lines.length === maxLines) break;
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines;
}

async function buildPlaceholderImage(productName) {
  const lines = wrapLines(productName, 14, 4);
  const fontSize = lines.length <= 2 ? 64 : lines.length === 3 ? 52 : 44;
  const lineHeight = fontSize * 1.3;
  const totalHeight = lines.length * lineHeight;
  const startY = IMAGE_SIZE / 2 - totalHeight / 2 + fontSize * 0.75;
  const tspans = lines
    .map((line, i) => `<tspan x="50%" y="${startY + i * lineHeight}">${escapeXml(line)}</tspan>`)
    .join("");

  const svg = `<svg width="${IMAGE_SIZE}" height="${IMAGE_SIZE}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#F1F5F9"/>
    <rect x="28" y="28" width="${IMAGE_SIZE - 56}" height="${IMAGE_SIZE - 56}" rx="28" fill="none" stroke="#CBD5E1" stroke-width="4" stroke-dasharray="14 10"/>
    <text font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="${fontSize}" fill="#475569" text-anchor="middle">${tspans}</text>
  </svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function uploadImage(supabaseUrl, serviceKey, bytes, destPath) {
  const response = await fetch(`${supabaseUrl}/storage/v1/object/${BUCKET}/${destPath}`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "image/png",
      "x-upsert": "true",
    },
    body: bytes,
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Upload failed for ${destPath}: HTTP ${response.status} ${body.slice(0, 200)}`);
  }
}

function readCigaretteRows() {
  const wb = XLSX.readFile(STOK_XLS_PATH);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  const header = rows[0];
  const idx = (name) => header.indexOf(name);
  const barkodIdx = idx("Barkod");
  const cinsIdx = idx("Stok Cinsi");
  const reyonIdx = idx("Reyon");
  const fiyatIdx = idx("Fiyat");

  const items = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const reyon = (row[reyonIdx] || "").toString().trim();
    if (reyon !== "SİGARALAR") continue;

    const barkod = (row[barkodIdx] || "").toString().trim();
    const productName = (row[cinsIdx] || "").toString().trim();
    const price = parseTlPrice(row[fiyatIdx]);
    if (!barkod || !productName) continue;

    items.push({ barkod, productName, price });
  }
  return items;
}

async function main() {
  loadDotEnvLocal();
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error("SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli (.env.local üzerinden okunuyor).");
  }

  const items = readCigaretteRows();
  console.log(`${items.length} sigara ürünü STOK.xls içinden bulundu.`);

  const limit = pLimit(UPLOAD_CONCURRENCY);
  let uploaded = 0;
  let failed = 0;

  const products = await Promise.all(
    items.map((item) =>
      limit(async () => {
        const destPath = `${SOURCE_NAME}/${item.barkod}.png`;
        try {
          const imageBytes = await buildPlaceholderImage(item.productName);
          await uploadImage(supabaseUrl, serviceKey, imageBytes, destPath);
          uploaded++;
        } catch (error) {
          failed++;
          console.error(String(error));
          return null;
        }

        return {
          source: SOURCE_NAME,
          sku_code: item.barkod,
          product_name: item.productName,
          brand: null,
          category_name: CATEGORY_NAME,
          image_url: `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${destPath}`,
          reference_price: item.price,
          description: null,
        };
      }),
    ),
  );

  const successfulProducts = products.filter((p) => p !== null);
  console.log(`Görsel üretimi/yükleme tamamlandı: ${uploaded} başarılı, ${failed} başarısız.`);

  const dataFile = path.join(PROJECT_ROOT, "data", "products.json");
  const existing = JSON.parse(await readFile(dataFile, "utf8"));
  const keptExisting = existing.filter((p) => p.source !== SOURCE_NAME);
  const merged = [...keptExisting, ...successfulProducts];

  await writeFile(dataFile, JSON.stringify(merged, null, 2) + "\n", "utf8");
  console.log(
    `data/products.json güncellendi: ${keptExisting.length} mevcut + ${successfulProducts.length} yeni sigara = ${merged.length} toplam.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
