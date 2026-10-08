import type { SupabaseClient } from "@supabase/supabase-js";
import { hasPlanFeature, type TenantPlan } from "@/lib/billing/plans";
import { formatPaymentMethod } from "@/lib/orders/format";
import {
  autoMatch,
  buildBizimHesapIndex,
  normalizeBizimHesapProducts,
  type BizimHesapProduct,
} from "@/lib/integrations/bizimhesap-matching";

// BizimHesap B2B API (https://apidocs.bizimhesap.com). Kimlik: Key (BizimHesap'ın
// genel entegrasyon anahtarı, env) + Token/firmId (mağazanın firma kimliği,
// tenant_bizimhesap tablosunda gizli). Ürünler BizimHesap'ta productId = bizim
// stok kodumuzla eşleşir; yoksa BizimHesap otomatik açar. Fiyatlar KDV DAHİL
// kabul edilir, KDV içinden ayrılır (kullanıcı kararı 6 Eki 2026).

const API_BASE = "https://bizimhesap.com/api/b2b/";

// SABİT KURAL (8 Eki 2026, Lucatech): ayarlardan bağımsız. Yalnız panelde
// ONAYLANAN siparişler aktarılır (elle "Tekrar gönder" dahil); eşleşmeyen ürün
// varsa gönderilmez — BizimHesap'ta ASLA ürün açılmaz; cari her zaman "eKatalox".
const ENFORCED_POLICIES: Record<string, { sendOn: "confirmed"; requireProductMatch: true; fixedCustomerTitle: string }> = {
  "ebeeec82-7cd9-4ab8-bea9-f3dc2a5bfe0c": { sendOn: "confirmed", requireProductMatch: true, fixedCustomerTitle: "eKatalox" },
};

export type BizimHesapPolicy = {
  sendOn: "order" | "confirmed";
  requireProductMatch: boolean;
  fixedCustomerTitle: string | null;
  /** true: kurallar mağazaya sabitlenmiş, panelden değiştirilemez. */
  locked: boolean;
};

/** Mağazanın geçerli aktarım kuralları: sabit kural varsa o, yoksa ayarlar (0166). */
export function resolveBizimHesapPolicy(
  tenantId: string,
  config: { send_on?: string | null; require_product_match?: boolean | null; fixed_customer_title?: string | null } | null,
): BizimHesapPolicy {
  const enforced = ENFORCED_POLICIES[tenantId];
  if (enforced) return { ...enforced, locked: true };
  return {
    sendOn: config?.send_on === "confirmed" ? "confirmed" : "order",
    requireProductMatch: Boolean(config?.require_product_match),
    fixedCustomerTitle: config?.fixed_customer_title?.trim() || null,
    locked: false,
  };
}

/** Onaylanmış sayılan durumlar (toptancı akışı 0154: Onaylandı ve sonrası). */
const APPROVED_STATUSES = new Set(["confirmed", "preparing", "shipped", "delivered"]);

type BizimHesapResult = { ok: true; guid: string; url: string | null } | { ok: false; error: string };

function apiKey() {
  return process.env.BIZIMHESAP_KEY ?? "";
}

async function callBizimHesap(path: string, firmId: string, body?: unknown) {
  const response = await fetch(API_BASE + path, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Key: apiKey(),
      Token: firmId,
      Accept: "application/json",
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  const text = await response.text();
  let json: Record<string, unknown> | null = null;
  try {
    json = JSON.parse(text) as Record<string, unknown>;
  } catch {
    json = null;
  }
  return { status: response.status, json, text };
}

/** Bağlantı testi: depo listesini okur (yazma yapmaz). */
export async function testBizimHesapConnection(firmId: string): Promise<{ ok: boolean; message: string }> {
  if (!apiKey()) return { ok: false, message: "Sunucuda BizimHesap anahtarı tanımlı değil." };
  try {
    const { status, json } = await callBizimHesap("warehouses", firmId);
    const errorText = typeof json?.errorText === "string" ? json.errorText : "";
    if (status === 200 && json && !errorText) return { ok: true, message: "Bağlantı başarılı." };
    return { ok: false, message: errorText || `BizimHesap yanıtı: ${status}` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Bağlantı kurulamadı." };
  }
}

/**
 * BizimHesap faturadaki ürünü productId ("kaynak sistem kodu") ile tanır. Kartın
 * Ürün Kodu doluysa o, değilse Barkodu gönderilir (Lucatech: fişte kod görünmesin
 * diye barkodla eşleştirme isteği, 8 Eki 2026). İkisi de boşsa kart tanınamaz.
 */
export function bizimhesapCardKey(card: { code?: string | null; barcode?: string | null }) {
  return card.code?.trim() || card.barcode?.trim() || "";
}

/** BizimHesap stok kartları (eşleştirme ekranı ve otomatik eşleştirme için). */
export async function fetchBizimHesapProducts(firmId: string): Promise<BizimHesapProduct[] | null> {
  if (!apiKey()) return null;
  try {
    const { status, json } = await callBizimHesap("products", firmId);
    if (status !== 200) return null;
    return normalizeBizimHesapProducts(json);
  } catch {
    return null;
  }
}

type OrderItem = {
  variant_id?: string | null;
  original_price?: number | null;
  product_name?: string | null;
  sku_code?: string | null;
  product_id?: string | null;
  variant_name?: string | null;
  quantity?: number | null;
  price?: number | null;
  is_gift?: boolean | null;
};

const round2 = (value: number) => Math.round(value * 100) / 100;
const money = (value: number) =>
  round2(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const plain = (value: number) => round2(value).toFixed(2);

function currencyCode(currency: string | null | undefined) {
  const c = (currency ?? "TRY").toUpperCase();
  return c === "TRY" || c === "TL" ? "TL" : c;
}

// BizimHesap müşteri kimliği sayı bekliyor: telefonun son 10 hanesi (aynı bayi
// aynı cariye düşer); telefonsuz siparişler ortak "eKatalox" carisine.
function customerIdFromPhone(phone: string | null | undefined) {
  const digits = (phone ?? "").replace(/\D/g, "").slice(-10);
  return digits.length >= 10 ? Number(digits) : 900000;
}

type BizimHesapCustomer = {
  id: string;
  title: string | null;
  phone: string | null;
  address: string | null;
  taxno: string | null;
  taxoffice: string | null;
  email: string | null;
};

const phone10 = (phone: string | null | undefined) => (phone ?? "").replace(/\D/g, "").slice(-10);
const normalizeTitle = (title: string) =>
  title.toLocaleLowerCase("tr").replace(/[.,;:'"()]/g, " ").replace(/\s+/g, " ").trim();

/**
 * BizimHesap'ta zaten açılmış cariyi bulur (belgelenmemiş GET b2b/customers ucu, 7 Eki 2026'da
 * doğrulandı): önce telefonun son 10 hanesi, tek sonuç yoksa unvan birebir (büyük/küçük harf ve
 * noktalama hariç). Bayi adı "Firma (Kişi)" ise firma kısmı da denenir. Birden fazla aday varsa
 * yanlış cariye yazmamak için eşleştirme yapılmaz. Liste alınamazsa null (eski davranış).
 */
async function findExistingCustomer(firmId: string, name: string, phone: string | null | undefined) {
  try {
    const { status, json } = await callBizimHesap("customers", firmId);
    const list = (json?.data as { customers?: BizimHesapCustomer[] } | undefined)?.customers;
    if (status !== 200 || !Array.isArray(list)) return null;
    const p = phone10(phone);
    if (p.length === 10) {
      const byPhone = list.filter((c) => phone10(c.phone) === p);
      if (byPhone.length === 1) return byPhone[0];
    }
    const names = new Set(
      [name, name.replace(/\s*\([^)]*\)\s*$/, "")].map(normalizeTitle).filter((n) => n.length > 0),
    );
    const byTitle = list.filter((c) => names.has(normalizeTitle(c.title ?? "")));
    return byTitle.length === 1 ? byTitle[0] : null;
  } catch {
    return null;
  }
}

/** Sabit cari: unvanı birebir (büyük/küçük harf, noktalama hariç) tek cari. */
async function findCustomerByTitle(firmId: string, title: string) {
  try {
    const { status, json } = await callBizimHesap("customers", firmId);
    const list = (json?.data as { customers?: BizimHesapCustomer[] } | undefined)?.customers;
    if (status !== 200 || !Array.isArray(list)) return null;
    const wanted = normalizeTitle(title);
    const matches = list.filter((c) => normalizeTitle(c.title ?? "") === wanted);
    return matches.length === 1 ? matches[0] : null;
  } catch {
    return null;
  }
}

/** BizimHesap carileri (onay penceresi; her açılışta canlı çekilir). */
export async function fetchBizimHesapCustomers(firmId: string) {
  if (!apiKey()) return null;
  try {
    const { status, json } = await callBizimHesap("customers", firmId);
    const list = (json?.data as { customers?: BizimHesapCustomer[] } | undefined)?.customers;
    if (status !== 200 || !Array.isArray(list)) return null;
    return list.filter((c) => c && c.id);
  } catch {
    return null;
  }
}

/** Bayi → cari hafızası anahtarı: kişiye özel şifre, yoksa telefon, yoksa ad. */
export function bizimhesapCustomerLinkKey(order: {
  access_code_id?: string | null;
  customer_phone?: string | null;
  customer_name?: string | null;
}) {
  if (order.access_code_id) return `kod:${order.access_code_id}`;
  const phone = phone10(order.customer_phone);
  if (phone.length === 10) return `tel:${phone}`;
  const name = normalizeTitle(order.customer_name ?? "");
  return name ? `ad:${name}` : null;
}

/**
 * Siparişi BizimHesap'a satış belgesi olarak gönderir ve sonucu orders satırına
 * yazar. Asla fırlatmaz; sipariş akışını engellememeli (after() içinde çağrılır).
 * Zaten gönderilmiş siparişi tekrar göndermez (force=false).
 */
export async function sendOrderToBizimHesap(
  supabase: SupabaseClient,
  orderId: string,
  // trigger: "order" = vitrinde sipariş oluşunca, "confirmed" = panelde Onaylandı'ya
  // geçince, "manual" = panelden "Tekrar gönder". Mağazanın send_on ayarı (0166)
  // hangisinde gönderileceğini seçer; manual her zaman gönderir.
  options: { force?: boolean; trigger?: "order" | "confirmed" | "manual" } = {},
): Promise<BizimHesapResult> {
  const fail = async (error: string): Promise<BizimHesapResult> => {
    await supabase
      .from("orders")
      .update({ bizimhesap_error: error.slice(0, 500), bizimhesap_sent_at: new Date().toISOString() })
      .eq("id", orderId);
    return { ok: false, error };
  };

  try {
    const { data: order } = await supabase
      .from("orders")
      .select(
        "id, tenant_id, status, order_number, order_no, customer_name, customer_phone, customer_address, currency, total_amount, coupon_discount, items, note, payment_method, bizimhesap_guid, bizimhesap_customer_id",
      )
      .eq("id", orderId)
      .maybeSingle();
    if (!order) return { ok: false, error: "Sipariş bulunamadı." };
    if (order.bizimhesap_guid && !options.force) return { ok: true, guid: order.bizimhesap_guid, url: null };
    if (!order.currency || order.currency === "CATALOG") return { ok: false, error: "Fiyatsız katalog siparişi gönderilmez." };

    const { data: config } = await supabase
      .from("tenant_bizimhesap")
      .select("firm_id, vat_rate, is_enabled, send_on, fixed_customer_title, require_product_match")
      .eq("tenant_id", order.tenant_id)
      .maybeSingle();
    if (!config?.is_enabled || !config.firm_id) return { ok: false, error: "BizimHesap bağlantısı kapalı." };
    const policy = resolveBizimHesapPolicy(order.tenant_id, config);
    const trigger = options.trigger ?? "order";
    const sendOn = policy.sendOn;
    if (trigger !== "manual" && trigger !== sendOn) {
      return { ok: false, error: sendOn === "confirmed" ? "Sipariş onaylanınca gönderilecek." : "Sipariş gelince gönderildi." };
    }
    // "Onaylanınca" modunda onaylanmamış sipariş HİÇBİR yoldan gitmez (elle gönderim dahil).
    if (sendOn === "confirmed" && !APPROVED_STATUSES.has(String(order.status ?? ""))) {
      return { ok: false, error: "Yalnız onaylanan siparişler BizimHesap'a aktarılır." };
    }
    // Paket düşerse (Kurumsal dışı) aktarım durur; bağlantı kaydı silinmez.
    const { data: tenantRow } = await supabase.from("tenants").select("plan").eq("id", order.tenant_id).maybeSingle();
    if (!hasPlanFeature((tenantRow?.plan ?? "free") as TenantPlan, "bizimhesap")) {
      return { ok: false, error: "BizimHesap entegrasyonu Kurumsal pakette." };
    }
    if (!apiKey()) return fail("Sunucuda BizimHesap anahtarı tanımlı değil.");

    // Eşleştirilmiş ürünler BizimHesap iç kimliğiyle gider (0160; varyant 0166), yoksa stok koduyla.
    const orderItems = (Array.isArray(order.items) ? order.items : []) as OrderItem[];
    const productIds = [...new Set(orderItems.map((item) => item.product_id).filter((id): id is string => Boolean(id)))];
    const variantIds = [...new Set(orderItems.map((item) => item.variant_id).filter((id): id is string => Boolean(id)))];
    const bizimhesapIdByProduct = new Map<string, string>();
    const bizimhesapIdByVariant = new Map<string, string>();
    const skuByProduct = new Map<string, string | null>();
    if (productIds.length) {
      const { data: mapped } = await supabase
        .from("products")
        .select("id, sku_code, bizimhesap_product_id")
        .in("id", productIds);
      for (const row of mapped ?? []) {
        skuByProduct.set(row.id, row.sku_code ?? null);
        if (row.bizimhesap_product_id) bizimhesapIdByProduct.set(row.id, row.bizimhesap_product_id);
      }
    }
    if (variantIds.length) {
      const { data: mappedVariants } = await supabase
        .from("product_variants")
        .select("id, bizimhesap_product_id")
        .in("id", variantIds)
        .not("bizimhesap_product_id", "is", null);
      for (const row of mappedVariants ?? []) bizimhesapIdByVariant.set(row.id, row.bizimhesap_product_id);
    }
    const resolveMapped = (item: OrderItem) =>
      (item.variant_id ? bizimhesapIdByVariant.get(item.variant_id) : undefined) ??
      (item.product_id ? bizimhesapIdByProduct.get(item.product_id) : undefined);

    // Zorunlu eşleşme (Lucatech): eşleşmeyen satırlar için BizimHesap stok kartlarında
    // tek ve kesin aday aranır, bulunanlar kaydedilir; hâlâ eşleşmeyen varsa GÖNDERİLMEZ
    // (BizimHesap'ta yanlış/yeni ürün açılmasın).
    if (policy.requireProductMatch && orderItems.some((item) => !item.product_id)) {
      return fail("Siparişte katalogda artık olmayan bir ürün var; BizimHesap'a elle girilmeli.");
    }
    if (policy.requireProductMatch) {
      // Sabit kurallı mağazada (Lucatech) gönderimde TAHMİN yapılmaz: yalnız personelin
      // panelde onayladığı eşleşmeler kullanılır. Diğerlerinde tek ve kesin aday kaydedilir.
      const pending = policy.locked ? [] : orderItems.filter((item) => item.product_id && !resolveMapped(item));
      if (pending.length) {
        const bhProducts = await fetchBizimHesapProducts(config.firm_id);
        if (!bhProducts) return fail("BizimHesap ürün listesi alınamadı; tekrar deneyin.");
        const index = buildBizimHesapIndex(bhProducts);
        for (const item of pending) {
          const code = item.sku_code ?? skuByProduct.get(item.product_id!) ?? null;
          const name = item.product_name ?? "";
          if (item.variant_id) {
            const match = autoMatch(index, { code, name, variantName: item.variant_name ?? null });
            if (match) {
              bizimhesapIdByVariant.set(item.variant_id, match.id);
              await supabase.from("product_variants").update({ bizimhesap_product_id: match.id }).eq("id", item.variant_id);
              continue;
            }
          }
          // Ürün düzeyi: BizimHesap'ta bu stok koduyla TEK kart varsa (renkler ayrı kart değil).
          const match = autoMatch(index, { code, name });
          if (match) {
            bizimhesapIdByProduct.set(item.product_id!, match.id);
            await supabase.from("products").update({ bizimhesap_product_id: match.id }).eq("id", item.product_id!);
          }
        }
      }
      // Hediye satırları dahil HER satır eşleşmiş olmalı; yoksa gönderilmez.
      const unmatched = orderItems.filter((item) => !resolveMapped(item));
      if (unmatched.length) {
        const names = unmatched
          .map((item) => [item.sku_code ?? item.product_name, item.variant_name].filter(Boolean).join(" "))
          .slice(0, 5)
          .join(", ");
        return fail(
          `BizimHesap'ta eşleşmeyen ürün var: ${names}${unmatched.length > 5 ? "…" : ""}. Ürünler > BizimHesap Eşleştirme'den seçip tekrar gönderin.`,
        );
      }
    }

    // BizimHesap faturadaki ürünü İÇ KİMLİKLE DEĞİL "Ürün Kodu" ile tanır (productId =
    // "kaynak sistem kodu"; 8 Eki 2026 Lucatech vakası: iç kimlik gönderilince tanınmayıp
    // yeni ürün açıldı). Eşlenen kartın kodu canlı okunur ve o kodla gönderilir.
    const cardByMappedId = new Map<string, BizimHesapProduct>();
    if (orderItems.some((item) => resolveMapped(item))) {
      const liveProducts = await fetchBizimHesapProducts(config.firm_id);
      if (!liveProducts) return fail("BizimHesap ürün listesi alınamadı; tekrar deneyin.");
      for (const product of liveProducts) cardByMappedId.set(product.id, product);
    }
    if (policy.requireProductMatch) {
      const problems = orderItems.flatMap((item) => {
        const card = cardByMappedId.get(resolveMapped(item) ?? "");
        const label = [item.sku_code ?? item.product_name, item.variant_name].filter(Boolean).join(" ");
        if (!card) return [`${label} (eşlendiği kart BizimHesap'ta yok)`];
        if (!bizimhesapCardKey(card)) return [`${label} (BizimHesap kartının Ürün Kodu ve Barkodu boş: ${card.title})`];
        return [];
      });
      if (problems.length) {
        return fail(
          `Gönderilmedi: ${problems.slice(0, 4).join("; ")}${problems.length > 4 ? "…" : ""}. BizimHesap'ta ürün açılmaması için kart kodları dolu olmalı.`,
        );
      }
    }

    const rate = Number(config.vat_rate ?? 20);
    const divisor = 1 + rate / 100;
    const items = orderItems;

    const details = items.map((item) => {
      const quantity = Number(item.quantity ?? 0) || 0;
      const unitGross = Number(item.price ?? 0) || 0; // KDV dahil
      const lineTotal = round2(unitGross * quantity);
      const lineNet = round2(lineTotal / divisor);
      // Liste indirimi (Vedat Bey isteği, 7 Eki 2026): birim fiyat listenin indirimsiz
      // (perakende) fiyatı, aradaki fark satır iskontosu olarak gider.
      const listGross = Number(item.original_price ?? 0) || 0;
      const unitList = listGross > unitGross ? listGross : unitGross;
      const lineGross = round2((unitList * quantity) / divisor);
      const lineDiscount = Math.max(0, round2(lineGross - lineNet));
      const name = [item.product_name ?? "Ürün", item.variant_name ? `(${item.variant_name})` : null]
        .filter(Boolean)
        .join(" ");
      const mappedCard = cardByMappedId.get(resolveMapped(item) ?? "");
      return {
        // Zorunlu eşleşmede YALNIZ eşleşmiş BizimHesap kimliği gider; stok koduna
        // düşülmez (BizimHesap bilinmeyen kodla yeni ürün açar).
        productId: mappedCard && bizimhesapCardKey(mappedCard)
          ? bizimhesapCardKey(mappedCard)
          : policy.requireProductMatch
            ? "" // yukarıda engellendi; buraya düşmez
            : item.sku_code || item.product_id || name,
        // Tanınan kartta BizimHesap'taki adı kullanılır (faturada aynı ad görünsün).
        productName: mappedCard && bizimhesapCardKey(mappedCard) ? mappedCard.title : name,
        note: item.is_gift ? "Hediye" : "",
        // Kart barkodla tanınıyorsa (fişte kod görünmesin diye Ürün Kodu boş) barkod da gider.
        barcode: mappedCard?.barcode?.trim() ?? "",
        taxRate: plain(rate),
        quantity,
        unitPrice: plain(unitList / divisor),
        grossPrice: money(lineGross),
        discount: money(lineDiscount),
        net: money(lineNet),
        tax: money(lineTotal - lineNet),
        total: money(lineTotal),
        _total: lineTotal,
        _net: lineNet,
        _gross: lineGross,
        _discount: lineDiscount,
      };
    });

    const linesTotal = details.reduce((sum, line) => sum + line._total, 0);
    const linesNet = details.reduce((sum, line) => sum + line._net, 0);
    const linesGross = details.reduce((sum, line) => sum + line._gross, 0);
    const linesDiscount = details.reduce((sum, line) => sum + line._discount, 0);
    const finalTotal = round2(Number(order.total_amount ?? linesTotal));
    // Kupon vb. sipariş indirimi: KDV dahil fark net'e oranlanır.
    const finalNet = round2(finalTotal / divisor);
    const discountNet = Math.max(0, round2(linesNet - finalNet));

    // BizimHesap'ta aynı telefon ya da unvanla açılmış cari varsa fiş ona yazılır (Vedat Bey isteği,
    // 7 Eki 2026); yoksa eskisi gibi telefondan türeyen kimlikle (ilk siparişte açılan cari).
    const phoneCustomer = {
      customerId: customerIdFromPhone(order.customer_phone) as number | string,
      title: order.customer_name?.trim() || "eKatalox Bayi",
      taxOffice: "",
      taxNo: "",
      email: "",
      phone: phone10(order.customer_phone),
      // BizimHesap adressiz belgeyi reddediyor ("Adres bilgisi gönderilmemiş", 6 Eki 2026).
      address: order.customer_address?.trim() || "Adres belirtilmedi",
    };
    // Sabit cari (0166, Lucatech): tüm siparişler tek unvanlı cariye (ör. "eKatalox")
    // taslak düşer; gerçek bayiyi personel BizimHesap'ta seçer. Bayi bilgisi açıklamada.
    const fixedTitle = policy.fixedCustomerTitle;
    // Onay penceresinde seçilen cari (0167) her şeyden önce gelir.
    let existing: BizimHesapCustomer | null = null;
    if (order.bizimhesap_customer_id) {
      const customers = await fetchBizimHesapCustomers(config.firm_id);
      existing = customers?.find((c) => String(c.id) === String(order.bizimhesap_customer_id)) ?? null;
      if (!existing) return fail("Onayda seçilen BizimHesap carisi bulunamadı (silinmiş olabilir); cariyi yeniden seçip tekrar gönderin.");
    } else {
      existing = fixedTitle
        ? await findCustomerByTitle(config.firm_id, fixedTitle)
        : await findExistingCustomer(config.firm_id, order.customer_name?.trim() ?? "", order.customer_phone);
    }
    const fallbackCustomer = fixedTitle
      ? { ...phoneCustomer, customerId: 900001, title: fixedTitle, phone: "", address: "Adres belirtilmedi" }
      : phoneCustomer;
    const customer = existing
      ? {
          customerId: existing.id as number | string,
          title: existing.title?.trim() || phoneCustomer.title,
          taxOffice: existing.taxoffice ?? "",
          taxNo: existing.taxno ?? "",
          email: existing.email ?? "",
          phone: phone10(existing.phone) || phoneCustomer.phone,
          address: existing.address?.trim() || phoneCustomer.address,
        }
      : fallbackCustomer;

    const now = new Date().toISOString();
    const body = {
      firmId: config.firm_id,
      // Panelde görünen sipariş numarasıyla eşleşsin: EKX-100003 (iç kod okunaksızdı).
      invoiceNo: order.order_no ? `EKX-${order.order_no}` : (order.order_number ?? ""),
      invoiceType: 3,
      note: [
        `eKatalox siparişi${order.order_no ? ` #${order.order_no}` : ""}`,
        fixedTitle
          ? `Bayi: ${[order.customer_name, order.customer_phone, order.customer_address].map((v) => v?.trim()).filter(Boolean).join(" · ") || "belirtilmedi"}`
          : null,
        order.payment_method ? `Ödeme: ${formatPaymentMethod(order.payment_method)}` : null,
        order.note,
      ]
        .filter(Boolean)
        .join(" — "),
      dates: { invoiceDate: now, dueDate: now, deliveryDate: now },
      customer,
      amounts: {
        currency: currencyCode(order.currency),
        gross: money(linesGross),
        discount: money(linesDiscount + discountNet),
        net: money(finalNet),
        tax: money(finalTotal - finalNet),
        total: money(finalTotal),
      },
      details: details.map((line) => {
        const { _total, _net, _gross, _discount, ...payload } = line;
        void _total;
        void _net;
        void _gross;
        void _discount;
        return payload;
      }),
    };

    let { status, json, text } = await callBizimHesap("addinvoice", config.firm_id, body);
    // Eşleşen cari kimliği reddedilirse sipariş aktarımı kırılmasın: eski yöntemle (telefon kimliği) tekrar dene.
    // (BizimHesap başarılı yanıtta da boş "error" alanı dönebilir; yalnız dolu hata ya da guid yokluğu ret sayılır.)
    const rejected = status !== 200 || Boolean(typeof json?.error === "string" && json.error) || !(typeof json?.guid === "string" && json.guid);
    if (existing && rejected) {
      ({ status, json, text } = await callBizimHesap("addinvoice", config.firm_id, { ...body, customer: fallbackCustomer }));
    }
    const error = typeof json?.error === "string" ? json.error : "";
    const guid = typeof json?.guid === "string" ? json.guid : "";
    if (status !== 200 || error || !guid) {
      return fail(error || `BizimHesap yanıtı ${status}: ${text.slice(0, 200)}`);
    }

    await supabase
      .from("orders")
      .update({ bizimhesap_guid: guid, bizimhesap_error: null, bizimhesap_sent_at: now })
      .eq("id", orderId);
    return { ok: true, guid, url: typeof json?.url === "string" ? json.url : null };
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Bilinmeyen hata");
  }
}
