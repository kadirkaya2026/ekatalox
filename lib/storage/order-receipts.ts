import type { SupabaseClient } from "@supabase/supabase-js";

export const ORDER_RECEIPTS_BUCKET = "order-receipts";

export function buildOrderReceiptOrderNumber(tenantId: string) {
  const tenantPrefix = tenantId.replace(/-/g, "").slice(0, 8);
  const now = new Date();
  const timestamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("");
  const randomSuffix = Math.random().toString(36).slice(2, 6);

  return `${tenantPrefix}_${timestamp}_${randomSuffix}`;
}

export function buildOrderReceiptPath(tenantId: string, orderNumber: string) {
  return `${tenantId}/${orderNumber}.pdf`;
}

export async function uploadOrderReceiptPdf(params: {
  supabase: SupabaseClient;
  tenantId: string;
  orderNumber: string;
  pdfBytes: Uint8Array;
}) {
  const filePath = buildOrderReceiptPath(params.tenantId, params.orderNumber);

  const { error } = await params.supabase.storage
    .from(ORDER_RECEIPTS_BUCKET)
    .upload(filePath, params.pdfBytes, {
      upsert: false,
      contentType: "application/pdf",
    });

  if (error) {
    throw error;
  }

  const { data } = params.supabase.storage
    .from(ORDER_RECEIPTS_BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
}
