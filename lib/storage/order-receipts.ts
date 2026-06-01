import type { SupabaseClient } from "@supabase/supabase-js";
import { appEnv } from "@/lib/env";

export const ORDER_RECEIPTS_BUCKET = "order-receipts";
export const ORDER_RECEIPT_EXPIRY_HOURS = 24;
export const ORDER_RECEIPT_CLEANUP_BATCH_SIZE = 100;

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface OrderReceiptRecord {
  id: string;
  secure_pdf_id: string;
  tenant_id: string;
  order_number: string;
  storage_path: string;
  pdf_public_url: string;
  created_at: string;
  expires_at: string;
}

export function isValidSecurePdfId(value: string) {
  return UUID_V4_REGEX.test(value);
}

export function buildSecureOrderReceiptUrl(securePdfId: string, origin?: string) {
  const base = origin ?? `https://${appEnv.rootDomain}`;
  return `${base}/api/storefront/pdf/${securePdfId}`;
}

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

  return {
    storagePath: filePath,
    publicUrl: data.publicUrl,
  };
}

export async function insertOrderReceiptRecord(params: {
  supabase: SupabaseClient;
  securePdfId: string;
  tenantId: string;
  orderNumber: string;
  storagePath: string;
  pdfPublicUrl: string;
}) {
  const expiresAt = new Date(
    Date.now() + ORDER_RECEIPT_EXPIRY_HOURS * 60 * 60 * 1000,
  ).toISOString();

  const { error } = await params.supabase.from("order_receipts").insert({
    secure_pdf_id: params.securePdfId,
    tenant_id: params.tenantId,
    order_number: params.orderNumber,
    storage_path: params.storagePath,
    pdf_public_url: params.pdfPublicUrl,
    expires_at: expiresAt,
  });

  if (error) {
    throw error;
  }
}

export async function getOrderReceiptBySecureId(
  supabase: SupabaseClient,
  securePdfId: string,
): Promise<OrderReceiptRecord | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("order_receipts")
    .select("*")
    .eq("secure_pdf_id", securePdfId)
    .gt("expires_at", now)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteExpiredOrderReceipts(supabase: SupabaseClient) {
  const now = new Date().toISOString();
  const { data: expired, error } = await supabase
    .from("order_receipts")
    .select("id, storage_path")
    .lt("expires_at", now)
    .limit(ORDER_RECEIPT_CLEANUP_BATCH_SIZE);

  if (error) {
    throw error;
  }

  if (!expired?.length) {
    return { deletedCount: 0 };
  }

  const storagePaths = expired.map((record) => record.storage_path);
  const ids = expired.map((record) => record.id);

  const { error: storageError } = await supabase.storage
    .from(ORDER_RECEIPTS_BUCKET)
    .remove(storagePaths);

  if (storageError) {
    console.error("[order-receipts] storage cleanup error:", storageError);
  }

  const { error: deleteError } = await supabase
    .from("order_receipts")
    .delete()
    .in("id", ids);

  if (deleteError) {
    throw deleteError;
  }

  return { deletedCount: ids.length };
}
