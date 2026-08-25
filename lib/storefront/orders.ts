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
}) {
  const phone = normalizeCustomerPhone(params.customerPhone);
  const name = params.customerName.trim();
  const address = params.customerAddress.trim();

  // Adres ARTIK zorunlu degil. Tekel (gel-al) bayilerinde adres bos
  // gonderiliyordu ve bu satir yuzunden o bayilerin HICBIR siparisi
  // kaydedilmiyordu — ne musteri defteri olusuyordu ne de magnet
  // sahiplenmesi calisabilirdi. Telefon + isim yeterli.
  if (!phone || !name) {
    return;
  }

  const itemsSnapshot = params.items.map((item) => ({
    product_name: item.product_name,
    sku_code: item.sku_code ?? null,
    quantity: item.quantity,
    price: item.price,
    currency: item.currency,
  }));

  const { error } = await params.supabase.rpc("record_storefront_order", {
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
  });

  if (error) {
    // Sipariş/WhatsApp akışını bloklamamalı — sadece loglayıp geçiyoruz.
    console.error("[orders] record_storefront_order failed:", error);
  }
}
