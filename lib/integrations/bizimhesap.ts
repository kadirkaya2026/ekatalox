import type { SupabaseClient } from "@supabase/supabase-js";
import { hasPlanFeature, type TenantPlan } from "@/lib/billing/plans";

// BizimHesap B2B API (https://apidocs.bizimhesap.com). Kimlik: Key (BizimHesap'ın
// genel entegrasyon anahtarı, env) + Token/firmId (mağazanın firma kimliği,
// tenant_bizimhesap tablosunda gizli). Ürünler BizimHesap'ta productId = bizim
// stok kodumuzla eşleşir; yoksa BizimHesap otomatik açar. Fiyatlar KDV DAHİL
// kabul edilir, KDV içinden ayrılır (kullanıcı kararı 6 Eki 2026).

const API_BASE = "https://bizimhesap.com/api/b2b/";

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

type OrderItem = {
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

/**
 * Siparişi BizimHesap'a satış belgesi olarak gönderir ve sonucu orders satırına
 * yazar. Asla fırlatmaz; sipariş akışını engellememeli (after() içinde çağrılır).
 * Zaten gönderilmiş siparişi tekrar göndermez (force=false).
 */
export async function sendOrderToBizimHesap(
  supabase: SupabaseClient,
  orderId: string,
  options: { force?: boolean } = {},
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
        "id, tenant_id, order_number, order_no, customer_name, customer_phone, customer_address, currency, total_amount, coupon_discount, items, note, bizimhesap_guid",
      )
      .eq("id", orderId)
      .maybeSingle();
    if (!order) return { ok: false, error: "Sipariş bulunamadı." };
    if (order.bizimhesap_guid && !options.force) return { ok: true, guid: order.bizimhesap_guid, url: null };
    if (!order.currency || order.currency === "CATALOG") return { ok: false, error: "Fiyatsız katalog siparişi gönderilmez." };

    const { data: config } = await supabase
      .from("tenant_bizimhesap")
      .select("firm_id, vat_rate, is_enabled")
      .eq("tenant_id", order.tenant_id)
      .maybeSingle();
    if (!config?.is_enabled || !config.firm_id) return { ok: false, error: "BizimHesap bağlantısı kapalı." };
    // Paket düşerse (Kurumsal dışı) aktarım durur; bağlantı kaydı silinmez.
    const { data: tenantRow } = await supabase.from("tenants").select("plan").eq("id", order.tenant_id).maybeSingle();
    if (!hasPlanFeature((tenantRow?.plan ?? "free") as TenantPlan, "bizimhesap")) {
      return { ok: false, error: "BizimHesap entegrasyonu Kurumsal pakette." };
    }
    if (!apiKey()) return fail("Sunucuda BizimHesap anahtarı tanımlı değil.");

    const rate = Number(config.vat_rate ?? 20);
    const divisor = 1 + rate / 100;
    const items = (Array.isArray(order.items) ? order.items : []) as OrderItem[];

    const details = items.map((item) => {
      const quantity = Number(item.quantity ?? 0) || 0;
      const unitGross = Number(item.price ?? 0) || 0; // KDV dahil
      const lineTotal = round2(unitGross * quantity);
      const lineNet = round2(lineTotal / divisor);
      const name = [item.product_name ?? "Ürün", item.variant_name ? `(${item.variant_name})` : null]
        .filter(Boolean)
        .join(" ");
      return {
        productId: item.sku_code || item.product_id || name,
        productName: name,
        note: item.is_gift ? "Hediye" : "",
        barcode: "",
        taxRate: plain(rate),
        quantity,
        unitPrice: plain(unitGross / divisor),
        grossPrice: money(lineNet),
        discount: "0.00",
        net: money(lineNet),
        tax: money(lineTotal - lineNet),
        total: money(lineTotal),
        _total: lineTotal,
        _net: lineNet,
      };
    });

    const linesTotal = details.reduce((sum, line) => sum + line._total, 0);
    const linesNet = details.reduce((sum, line) => sum + line._net, 0);
    const finalTotal = round2(Number(order.total_amount ?? linesTotal));
    // Kupon vb. sipariş indirimi: KDV dahil fark net'e oranlanır.
    const finalNet = round2(finalTotal / divisor);
    const discountNet = Math.max(0, round2(linesNet - finalNet));

    const now = new Date().toISOString();
    const body = {
      firmId: config.firm_id,
      invoiceNo: order.order_number ?? (order.order_no ? `EKX-${order.order_no}` : ""),
      invoiceType: 3,
      note: [`eKatalox siparişi${order.order_no ? ` #${order.order_no}` : ""}`, order.note].filter(Boolean).join(" — "),
      dates: { invoiceDate: now, dueDate: now, deliveryDate: now },
      customer: {
        customerId: customerIdFromPhone(order.customer_phone),
        title: order.customer_name?.trim() || "eKatalox Bayi",
        taxOffice: "",
        taxNo: "",
        email: "",
        phone: (order.customer_phone ?? "").replace(/\D/g, "").slice(-10),
        address: order.customer_address ?? "",
      },
      amounts: {
        currency: currencyCode(order.currency),
        gross: money(linesNet),
        discount: money(discountNet),
        net: money(finalNet),
        tax: money(finalTotal - finalNet),
        total: money(finalTotal),
      },
      details: details.map((line) => {
        const { _total, _net, ...payload } = line;
        void _total;
        void _net;
        return payload;
      }),
    };

    const { status, json, text } = await callBizimHesap("addinvoice", config.firm_id, body);
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
