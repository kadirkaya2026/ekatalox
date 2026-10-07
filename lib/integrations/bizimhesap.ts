import type { SupabaseClient } from "@supabase/supabase-js";
import { hasPlanFeature, type TenantPlan } from "@/lib/billing/plans";
import { formatPaymentMethod } from "@/lib/orders/format";

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
        "id, tenant_id, order_number, order_no, customer_name, customer_phone, customer_address, currency, total_amount, coupon_discount, items, note, payment_method, bizimhesap_guid",
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

    // Eşleştirilmiş ürünler BizimHesap iç kimliğiyle gider (0160), yoksa stok koduyla.
    const productIds = [
      ...new Set(
        ((Array.isArray(order.items) ? order.items : []) as OrderItem[])
          .map((item) => item.product_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const bizimhesapIdByProduct = new Map<string, string>();
    if (productIds.length) {
      const { data: mapped } = await supabase
        .from("products")
        .select("id, bizimhesap_product_id")
        .in("id", productIds)
        .not("bizimhesap_product_id", "is", null);
      for (const row of mapped ?? []) bizimhesapIdByProduct.set(row.id, row.bizimhesap_product_id);
    }

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
        productId:
          (item.product_id ? bizimhesapIdByProduct.get(item.product_id) : undefined) ||
          item.sku_code ||
          item.product_id ||
          name,
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
    const existing = await findExistingCustomer(config.firm_id, order.customer_name?.trim() ?? "", order.customer_phone);
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
      : phoneCustomer;

    const now = new Date().toISOString();
    const body = {
      firmId: config.firm_id,
      // Panelde görünen sipariş numarasıyla eşleşsin: EKX-100003 (iç kod okunaksızdı).
      invoiceNo: order.order_no ? `EKX-${order.order_no}` : (order.order_number ?? ""),
      invoiceType: 3,
      note: [
        `eKatalox siparişi${order.order_no ? ` #${order.order_no}` : ""}`,
        order.payment_method ? `Ödeme: ${formatPaymentMethod(order.payment_method)}` : null,
        order.note,
      ]
        .filter(Boolean)
        .join(" — "),
      dates: { invoiceDate: now, dueDate: now, deliveryDate: now },
      customer,
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

    let { status, json, text } = await callBizimHesap("addinvoice", config.firm_id, body);
    // Eşleşen cari kimliği reddedilirse sipariş aktarımı kırılmasın: eski yöntemle (telefon kimliği) tekrar dene.
    // (BizimHesap başarılı yanıtta da boş "error" alanı dönebilir; yalnız dolu hata ya da guid yokluğu ret sayılır.)
    const rejected = status !== 200 || Boolean(typeof json?.error === "string" && json.error) || !(typeof json?.guid === "string" && json.guid);
    if (existing && rejected) {
      ({ status, json, text } = await callBizimHesap("addinvoice", config.firm_id, { ...body, customer: phoneCustomer }));
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
