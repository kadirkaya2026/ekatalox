import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { generateOrderReceiptPdf, type GenerateOrderReceiptPdfParams } from "@/lib/storefront/order-receipt-pdf";
import { loadReceiptItemImages } from "@/lib/storefront/receipt-images";
import { buildOrderReceiptPath, ORDER_RECEIPTS_BUCKET } from "@/lib/storage/order-receipts";
import { PAYMENT_PROVIDER_LABELS, type PaymentProvider } from "@/lib/payments/providers";
import { formatReceiptMoney } from "@/lib/storefront/order-receipt-display";

// Online ödeme onaylanınca sipariş fişi "ÖDENDİ" bilgisiyle yeniden üretilir
// (0186). Fiş bağlantısı (secure id / kısa link) değişmez: order_receipts
// satırı yeni dosyayı gösterir, eski dosya silinir. Hata ödemeyi etkilemez.

/** Fişin yeniden üretilebilmesi için saklanan girdiler (görseller hariç). */
export type StoredReceiptPayload = Omit<GenerateOrderReceiptPdfParams, "orderDate" | "itemImages" | "paymentMethodLabel"> & {
  orderDate: string;
};

export function buildReceiptPayload(
  params: Omit<GenerateOrderReceiptPdfParams, "itemImages" | "paymentMethodLabel">,
): StoredReceiptPayload {
  return { ...params, orderDate: params.orderDate.toISOString() };
}

export function formatOnlinePaidLabel(params: { provider: string | null; amount: number; paidAt: string }) {
  const provider = params.provider && params.provider in PAYMENT_PROVIDER_LABELS
    ? PAYMENT_PROVIDER_LABELS[params.provider as PaymentProvider]
    : null;
  const when = new Date(params.paidAt).toLocaleString("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `Online Ödeme - ÖDENDİ ${formatReceiptMoney(params.amount, "TRY")}${provider ? ` (${provider})` : ""} ${when}`;
}

export async function regeneratePaidReceipt(supabase: SupabaseClient, orderId: string) {
  const { data: order } = await supabase
    .from("orders")
    .select("id, tenant_id, order_number, receipt_payload, paid_amount, paid_at, payment_provider")
    .eq("id", orderId)
    .maybeSingle();
  const payload = order?.receipt_payload as StoredReceiptPayload | null | undefined;
  if (!order || !payload || !order.paid_at) return;
  const tenantId = order.tenant_id as string;

  const { data: receiptSetting } = await supabase
    .from("tenants")
    .select("receipt_show_images")
    .eq("id", tenantId)
    .maybeSingle();
  const itemImages =
    receiptSetting?.receipt_show_images === false
      ? []
      : await loadReceiptItemImages(supabase, tenantId, payload.items).catch(() => []);

  const pdfBytes = await generateOrderReceiptPdf({
    ...payload,
    orderDate: new Date(payload.orderDate),
    itemImages,
    paymentMethodLabel: formatOnlinePaidLabel({
      provider: order.payment_provider as string | null,
      amount: Number(order.paid_amount ?? 0),
      paidAt: order.paid_at as string,
    }),
  });

  // Yeni dosya adı: herkese açık PDF adresi CDN'de önbelleğe alınmış olabilir.
  const paidPath = buildOrderReceiptPath(tenantId, `${order.order_number as string}_odendi`);
  const { error: uploadError } = await supabase.storage
    .from(ORDER_RECEIPTS_BUCKET)
    .upload(paidPath, pdfBytes, { upsert: true, contentType: "application/pdf" });
  if (uploadError) throw uploadError;
  const { data: publicData } = supabase.storage.from(ORDER_RECEIPTS_BUCKET).getPublicUrl(paidPath);

  const { data: receipts } = await supabase
    .from("order_receipts")
    .update({ storage_path: paidPath, pdf_public_url: publicData.publicUrl })
    .eq("tenant_id", tenantId)
    .eq("order_number", order.order_number as string)
    .select("id");
  if (receipts?.length) {
    await supabase.storage
      .from(ORDER_RECEIPTS_BUCKET)
      .remove([buildOrderReceiptPath(tenantId, order.order_number as string)]);
  }
  await supabase.from("orders").update({ receipt_payload: null }).eq("id", orderId);
}
