// Eski siparişlerin kalemlerine maliyet (unit_cost) ve product_id yazar.
//
// 0091 öncesi siparişlerin items[] snapshot'ında ne product_id ne unit_cost
// var; sadece sku_code/product_name. Bu script her kalemi sırayla
//   1) product_id (varsa) → 2) (tenant, sku_code) → 3) lower(product_name)
// ile tenant'ın ürünlerine eşleştirir ve products.purchase_price'tan
//   unit_cost = purchase_price * (unit_quantity ?? 1)
// yazar (cost_source: "backfill"). Ardından orders.cost_total /
// cost_missing_count'u yeniden hesaplar.
//
// SINIRLAR: bugünkü maliyet geçmişe uygulanır (gerçek tarihsel maliyet değil);
// ürün yeniden adlandırıldıysa isim eşleşmesi tutmaz; eşleşmeyen kalem null
// kalır ve raporda "maliyeti eksik" sayılır. Idempotent: unit_cost'u zaten
// dolu kalemlere dokunmaz.
//
// Kullanım:
//   node scripts/backfill-order-cost-snapshot.js                    (dry-run)
//   node scripts/backfill-order-cost-snapshot.js --apply
//   node scripts/backfill-order-cost-snapshot.js --tenant tekelsiparis --apply

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const PROJECT_ROOT = path.join(__dirname, "..");
const PAGE = 500;

function loadDotEnvLocal() {
  const envPath = path.join(PROJECT_ROOT, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let value = t.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadDotEnvLocal();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY eksik.");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const tenantArgIdx = args.indexOf("--tenant");
const tenantSubdomain = tenantArgIdx >= 0 ? args[tenantArgIdx + 1] : null;

const round2 = (n) => Math.round(n * 100) / 100;

async function main() {
  let tenantId = null;
  if (tenantSubdomain) {
    const { data } = await supabase.from("tenants").select("id").eq("subdomain", tenantSubdomain).maybeSingle();
    if (!data) throw new Error("tenant bulunamadı: " + tenantSubdomain);
    tenantId = data.id;
  }

  // Ürün havuzu (tenant başına): id, sku, name, cost, currency
  const products = new Map(); // tenant_id -> { byId, bySku, byName }
  for (let from = 0; ; from += PAGE) {
    let q = supabase.from("products").select("id, tenant_id, sku_code, product_name, purchase_price, currency").range(from, from + PAGE - 1);
    if (tenantId) q = q.eq("tenant_id", tenantId);
    const { data, error } = await q;
    if (error) throw error;
    for (const p of data ?? []) {
      const bag = products.get(p.tenant_id) ?? { byId: new Map(), bySku: new Map(), byName: new Map() };
      bag.byId.set(p.id, p);
      if (p.sku_code) bag.bySku.set(String(p.sku_code).toLowerCase(), p);
      if (p.product_name) bag.byName.set(String(p.product_name).trim().toLowerCase(), p);
      products.set(p.tenant_id, bag);
    }
    if (!data || data.length < PAGE) break;
  }

  let seen = 0, touched = 0, matchedItems = 0, unmatchedItems = 0, skippedItems = 0;
  for (let from = 0; ; from += PAGE) {
    let q = supabase.from("orders").select("id, tenant_id, currency, items").order("created_at").range(from, from + PAGE - 1);
    if (tenantId) q = q.eq("tenant_id", tenantId);
    const { data, error } = await q;
    if (error) throw error;

    for (const order of data ?? []) {
      seen += 1;
      const bag = products.get(order.tenant_id);
      const items = Array.isArray(order.items) ? order.items : [];
      let changed = false;
      const next = items.map((item) => {
        if (item.unit_cost !== null && item.unit_cost !== undefined) { skippedItems += 1; return item; }
        let p = null;
        if (bag) {
          if (item.product_id) p = bag.byId.get(item.product_id) ?? null;
          if (!p && item.sku_code) p = bag.bySku.get(String(item.sku_code).toLowerCase()) ?? null;
          if (!p && item.product_name) p = bag.byName.get(String(item.product_name).trim().toLowerCase()) ?? null;
        }
        if (!p || typeof p.purchase_price !== "number" || p.currency !== item.currency) { unmatchedItems += 1; return item; }
        matchedItems += 1; changed = true;
        return {
          ...item,
          product_id: item.product_id ?? p.id,
          unit_cost: round2(p.purchase_price * (item.unit_quantity ?? 1)),
          cost_source: "backfill",
        };
      });
      if (!changed) continue;

      const known = next.filter((i) => typeof i.unit_cost === "number");
      const costTotal = known.length ? round2(known.reduce((t, i) => t + i.unit_cost * (i.quantity ?? 0), 0)) : null;
      const missing = next.length - known.length;
      touched += 1;
      if (APPLY) {
        const { error: upErr } = await supabase
          .from("orders")
          .update({ items: next, cost_total: costTotal, cost_missing_count: missing })
          .eq("id", order.id);
        if (upErr) throw upErr;
      }
    }
    if (!data || data.length < PAGE) break;
  }

  console.log(`${APPLY ? "UYGULANDI" : "DRY-RUN"} — sipariş: ${seen}, güncellenen: ${touched}, kalem eşleşti: ${matchedItems}, eşleşmedi: ${unmatchedItems}, zaten dolu: ${skippedItems}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
