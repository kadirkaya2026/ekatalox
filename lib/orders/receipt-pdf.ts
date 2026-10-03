import { getTenantStorefrontSettings } from "@/lib/data";
import { formatPaymentMethod } from "@/lib/orders/format";
import type { CartPaymentSummary } from "@/lib/storefront/cart";
import { generateOrderReceiptPdf } from "@/lib/storefront/order-receipt-pdf";
import { getBankTransferInfo } from "@/lib/storefront/payment-methods";
import { loadReceiptItemImages } from "@/lib/storefront/receipt-images";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { CartItem, StorefrontOrder } from "@/lib/types";

// Kayıtlı siparişten fiş PDF'i (3 Eki 2026): siparişin o anki kalemleri ve
// müşteri bilgileriyle sıfırdan üretilir; depoya yazılmaz.
// Route: app/api/tenant/orders/[orderId]/receipt-pdf.
export async function buildStoredOrderReceiptPdf(
  tenant: { id: string; company_name: string },
  order: StorefrontOrder,
  preloadedSettings?: Awaited<ReturnType<typeof getTenantStorefrontSettings>>,
): Promise<Uint8Array> {
  const supabase = createSupabaseAdminClient();
  const settings = preloadedSettings ?? (await getTenantStorefrontSettings(tenant.id));
  const items = order.items.map(
    (item, index) =>
      ({
        ...item,
        id: `${item.product_id ?? "satir"}-${index}`,
        product_id: item.product_id ?? "",
        category_id: "",
        image_url: null,
        image_url_2: null,
        image_url_3: null,
        is_in_stock: true,
        package_quantity: null,
        carton_quantity: null,
        stock_quantity: null,
        price: item.price ?? 0,
      }) as unknown as CartItem,
  );

  const catalogMode = order.currency === "CATALOG";
  let paymentSummary: CartPaymentSummary | null = null;
  if (!catalogMode) {
    // Kayıtlı siparişten özet: ara toplam satırlardan, genel toplam siparişten;
    // aradaki fark kupon, iskonto ya da vade farkı/teslimat olarak gösterilir.
    const round2 = (value: number) => Math.round(value * 100) / 100;
    const subtotal = round2(order.items.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0));
    const coupon = round2(Math.max(0, Number(order.coupon_discount ?? 0)));
    const rest = round2(subtotal - coupon - order.total_amount);
    const method = order.payment_method === "card" || order.payment_method === "transfer" ? order.payment_method : "cash";
    const discountAmount = rest > 0 ? rest : 0;
    const extra = rest < 0 ? -rest : 0;
    paymentSummary = {
      currency: order.currency as CartPaymentSummary["currency"],
      paymentMethod: method,
      subtotal,
      discountThreshold: 0,
      isQualified: discountAmount > 0,
      remainingAmount: 0,
      discountPercentage: subtotal > 0 ? round2((discountAmount / subtotal) * 100) : 0,
      discountAmount,
      afterDiscount: round2(subtotal - discountAmount - coupon),
      selectedInstallment: null,
      surchargePercentage: method === "card" && subtotal > 0 ? round2((extra / subtotal) * 100) : 0,
      surchargeAmount: method === "card" ? extra : 0,
      finalTotal: order.total_amount,
      zeroCommissionApplied: false,
      appliedCashTier: null,
      appliedCardTier: null,
      appliedCampaign: null,
      campaignDiscountAmount: 0,
      appliedCoupon: null,
      couponDiscountAmount: coupon,
      couponMissingAmount: 0,
      deliveryFeeAmount: method === "card" ? 0 : extra,
      deliveryFeeFreeThreshold: 0,
      deliveryFeeRemaining: 0,
    };
  }

  let itemImages: Array<string | null> = [];
  if (supabase) {
    const { data: receiptSetting } = await supabase.from("tenants").select("receipt_show_images").eq("id", tenant.id).maybeSingle();
    if (receiptSetting?.receipt_show_images !== false) {
      itemImages = await loadReceiptItemImages(supabase, tenant.id, items).catch(() => []);
    }
  }

  const pdfBytes = await generateOrderReceiptPdf({
    tenantName: settings.storefront_title?.trim() || tenant.company_name,
    customerReferenceName: order.customer_name || "",
    customerPhone: order.customer_phone,
    customerAddress: order.customer_address,
    orderNumber: order.order_number,
    orderNo: order.order_no ?? null,
    orderDate: new Date(order.created_at),
    items,
    paymentSummary,
    paymentMethodLabel: formatPaymentMethod(order.payment_method),
    bankTransfer: order.payment_method === "transfer" ? getBankTransferInfo(settings) : null,
    note: order.note,
    catalogMode,
    footerLine: null,
    itemImages,
  });

  return pdfBytes;
}
