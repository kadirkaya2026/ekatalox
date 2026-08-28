import type { SupabaseClient } from "@supabase/supabase-js";
import type { CartItem } from "@/lib/types";
import { normalizeCustomerPhone } from "@/lib/storefront/customer-phone";

// Market tenant checkout'ta zaten toplanan isim/adres/telefon (bkz.
// storefront-cart-drawer.tsx) buradan kalıcı customers/orders tablolarına
// yazılır. Telefon veya adres yoksa (genel tenant, ya da müşteri boş
// bıraktıysa — mixed-currency PDF hatası gibi durumlarda da olabilir)
// sessizce atlanır; bu bir sipariş engelleyici değil, sadece raporlama.
export async function recordStorefrontOrder(params: {
  supabase: SupabaseClient;
  tenantId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  orderNumber: string;
  currency: string;
  totalAmount: number;
  paymentMethod: "cash" | "card" | null;
  items: CartItem[];
  note?: string | null;
  // Siparişin geldiği magnetin magnet_codes.id'si. RPC içinde sipariş
  // satırına yazılır ve İLK siparişse magnet sessizce sahiplenilir.
  magnetCodeId?: string | null;
}): Promise<{ orderId: string; trackingToken: string | null } | null> {
  const phone = normalizeCustomerPhone(params.customerPhone);
  const name = params.customerName.trim();
  const address = params.customerAddress.trim();

  // Adres ARTIK zorunlu degil. Tekel (gel-al) bayilerinde adres bos
  // gonderiliyordu ve bu satir yuzunden o bayilerin HICBIR siparisi
  // kaydedilmiyordu — ne musteri defteri olusuyordu ne de magnet
  // sahiplenmesi calisabilirdi. Telefon + isim yeterli.
  if (!phone || !name) {
    return null;
  }

  // Maliyet, SİPARİŞ ANINDA kaleme dondurulur (unit_cost). Ürünün alış fiyatı
  // sonradan değişse de bu siparişin kârı değişmez. Ürün para birimi sipariş
  // para birimiyle uyuşmuyorsa maliyet bilinmiyor sayılır (kur çevrimi yok).
  const productIds = [...new Set(params.items.map((item) => item.product_id).filter(Boolean))];
  const costByProduct = new Map<string, { purchase_price: number | null; currency: string }>();
  if (productIds.length) {
    const { data: costRows } = await params.supabase
      .from("products")
      .select("id, purchase_price, currency")
      .eq("tenant_id", params.tenantId)
      .in("id", productIds);
    for (const row of costRows ?? []) {
      costByProduct.set(row.id, { purchase_price: row.purchase_price ?? null, currency: row.currency });
    }
  }

  const round2 = (value: number) => Math.round(value * 100) / 100;
  const itemsSnapshot = params.items.map((item) => {
    const cost = item.product_id ? costByProduct.get(item.product_id) : undefined;
    const unitCost =
      cost && typeof cost.purchase_price === "number" && cost.currency === item.currency
        ? round2(cost.purchase_price * (item.unit_quantity ?? 1))
        : null;
    return {
      product_name: item.product_name,
      sku_code: item.sku_code ?? null,
      quantity: item.quantity,
      price: item.price,
      currency: item.currency,
      product_id: item.product_id ?? null,
      variant_id: item.variant_id ?? null,
      variant_name: item.variant_name ?? null,
      sales_unit: item.sales_unit ?? null,
      unit_quantity: item.unit_quantity ?? null,
      original_price: item.original_price ?? null,
      discount_percentage: item.discount_percentage ?? null,
      unit_cost: unitCost,
      cost_source: unitCost === null ? null : "product",
    };
  });

  // p_magnet_code_id yalnizca doluysa gonderilir: parametre 0088'de eklendi
  // ve fonksiyonda default null. Bos gondermemek, migration henuz
  // calistirilmamis bir ortamda bile eski imzaya cozulmeyi garantiler —
  // deploy/migration sirasi siparis kaydini asla bozamaz.
  const magnetArgs = params.magnetCodeId ? { p_magnet_code_id: params.magnetCodeId } : {};

  const { data: orderId, error } = await params.supabase.rpc("record_storefront_order", {
    p_tenant_id: params.tenantId,
    p_phone: phone,
    p_full_name: name,
    p_address: address,
    p_order_number: params.orderNumber,
    p_currency: params.currency,
    p_total_amount: params.totalAmount,
    p_payment_method: params.paymentMethod,
    p_item_count: params.items.length,
    p_items: itemsSnapshot,
    p_note: params.note ?? null,
    ...magnetArgs,
  });

  if (error || typeof orderId !== "string") {
    // Sipariş/WhatsApp akışını bloklamamalı — sadece loglayıp geçiyoruz.
    console.error("[orders] record_storefront_order failed:", error);
    return null;
  }

  // Müşteri takip sayfası için token. 0091 henüz çalışmadıysa sütun yok →
  // sessizce null: sipariş yine kaydedildi, sadece takip linki üretilmez.
  const { data: tokenRow } = await params.supabase
    .from("orders")
    .select("tracking_token")
    .eq("id", orderId)
    .maybeSingle();

  return { orderId, trackingToken: tokenRow?.tracking_token ?? null };
}
