import { NextResponse } from "next/server";
import { getStorefrontTenant, getTenantStorefrontSettings } from "@/lib/data";
import { getCartPaymentSummary } from "@/lib/storefront/cart";
import {
  getOrderPdfRequestId,
  logOrderPdfServerEvent,
  serializeOrderPdfError,
} from "@/lib/storefront/order-pdf-log";
import { generateOrderReceiptPdf } from "@/lib/storefront/order-receipt-pdf";
import {
  buildOrderReceiptOrderNumber,
  buildSecureOrderReceiptUrl,
  insertOrderReceiptRecord,
  uploadOrderReceiptPdf,
} from "@/lib/storage/order-receipts";
import { recordStorefrontOrderStat } from "@/lib/analytics/record-stats";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getPublicOrigin } from "@/lib/tenancy/request-host";
import { storefrontOrderPdfSchema } from "@/lib/validators/storefront-order-pdf";
import type { CartItem } from "@/lib/types";

function buildPaymentMethodLabel(params: {
  paymentMethod: "cash" | "card";
  selectedInstallment: { label: string; surchargePercentage: number } | null;
  zeroCommissionApplied: boolean;
}) {
  if (params.paymentMethod === "cash") {
    return "Nakit";
  }

  if (!params.selectedInstallment) {
    return "Kredi Kartı";
  }

  const commissionStr = params.zeroCommissionApplied
    ? " - 0 Komisyon Kampanyası"
    : params.selectedInstallment.surchargePercentage > 0
      ? ` - %${params.selectedInstallment.surchargePercentage} Vade Farkı`
      : "";

  return `Kredi Kartı - ${params.selectedInstallment.label}${commissionStr}`;
}

function errorResponse(
  requestId: string | null,
  message: string,
  status: number,
  details: Record<string, unknown> = {},
) {
  logOrderPdfServerEvent("error", "request_rejected", {
    requestId,
    status,
    message,
    ...details,
  });

  return NextResponse.json({ error: message, requestId }, { status });
}

export async function POST(request: Request) {
  const requestId = getOrderPdfRequestId(request);
  const startedAt = Date.now();

  logOrderPdfServerEvent("info", "request_started", { requestId });

  let body: unknown;

  try {
    body = await request.json();
  } catch (error) {
    return errorResponse(requestId, "Sipariş verisi okunamadı.", 400, {
      reason: "invalid_json",
      error: serializeOrderPdfError(error),
    });
  }

  const parsed = storefrontOrderPdfSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(
      requestId,
      parsed.error.issues[0]?.message ?? "Sipariş verisi hatalı.",
      400,
      {
        reason: "validation_failed",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    );
  }

  logOrderPdfServerEvent("info", "payload_validated", {
    requestId,
    subdomain: parsed.data.subdomain,
    itemCount: parsed.data.items.length,
    paymentMethod: parsed.data.paymentMethod,
  });

  const tenant = await getStorefrontTenant(parsed.data.subdomain);

  if (!tenant || tenant.status !== "active") {
    return errorResponse(requestId, "Mağaza bulunamadı.", 404, {
      reason: "tenant_not_found",
      subdomain: parsed.data.subdomain,
      tenantStatus: tenant?.status ?? null,
    });
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return errorResponse(requestId, "Sunucu yapılandırması eksik.", 500, {
      reason: "missing_service_role",
      tenantId: tenant.id,
    });
  }

  const items = parsed.data.items as CartItem[];
  const catalogMode = parsed.data.catalog_mode;

  if (catalogMode) {
    const storefrontSettings = await getTenantStorefrontSettings(tenant.id);
    const tenantDisplayName =
      storefrontSettings.storefront_title?.trim() || tenant.company_name;
    const orderNumber = buildOrderReceiptOrderNumber(tenant.id);
    const orderDate = new Date();

    try {
      const pdfBytes = await generateOrderReceiptPdf({
        tenantName: tenantDisplayName,
        customerReferenceName: parsed.data.customer_reference_name,
        orderNumber,
        orderDate,
        items,
        paymentSummary: null,
        paymentMethodLabel: null,
        note: parsed.data.note,
        catalogMode: true,
      });

      const securePdfId = crypto.randomUUID();
      const { storagePath, publicUrl: pdfPublicUrl } = await uploadOrderReceiptPdf({
        supabase,
        tenantId: tenant.id,
        orderNumber,
        pdfBytes,
      });

      await insertOrderReceiptRecord({
        supabase,
        securePdfId,
        tenantId: tenant.id,
        orderNumber,
        storagePath,
        pdfPublicUrl,
      });

      await recordStorefrontOrderStat(supabase, tenant.id, { catalogMode: true });

      const pdfUrl = buildSecureOrderReceiptUrl(securePdfId, getPublicOrigin(request));
      return NextResponse.json({ pdfUrl, orderNumber, securePdfId, requestId });
    } catch (error) {
      logOrderPdfServerEvent("error", "request_failed", {
        requestId,
        tenantId: tenant.id,
        orderNumber,
        durationMs: Date.now() - startedAt,
        error: serializeOrderPdfError(error),
      });

      return errorResponse(requestId, "PDF oluşturulamadı.", 500, {
        reason: "pdf_pipeline_failed",
        tenantId: tenant.id,
        orderNumber,
      });
    }
  }

  const activeInstallmentOptions = parsed.data.cardInstallmentOptions.filter(
    (option) => option.isActive,
  );
  const selectedInstallment =
    parsed.data.paymentMethod === "card" && parsed.data.selectedInstallmentCount !== null
      ? (activeInstallmentOptions.find(
          (option) => option.count === parsed.data.selectedInstallmentCount,
        ) ?? null)
      : null;

  const cashConfig =
    parsed.data.paymentMethod === "cash"
      ? {
          tiers: parsed.data.cashDiscountTiers,
          isActive: parsed.data.isCashDiscountActive,
        }
      : null;
  const cardConfig =
    parsed.data.paymentMethod === "card"
      ? {
          tiers: parsed.data.cardCampaignTiers,
          isActive: parsed.data.isCardCampaignActive,
        }
      : null;

  const paymentSummary = getCartPaymentSummary(
    items,
    parsed.data.paymentMethod!,
    cashConfig,
    cardConfig,
    selectedInstallment,
  );

  if (!paymentSummary) {
    return errorResponse(
      requestId,
      "Sepet özeti hesaplanamadı. Tek para birimi kullanın.",
      400,
      {
        reason: "payment_summary_unavailable",
        tenantId: tenant.id,
        currencies: [...new Set(items.map((item) => item.currency))],
      },
    );
  }

  const storefrontSettings = await getTenantStorefrontSettings(tenant.id);
  const tenantDisplayName =
    storefrontSettings.storefront_title?.trim() || tenant.company_name;
  const orderNumber = buildOrderReceiptOrderNumber(tenant.id);
  const orderDate = new Date();

  try {
    const pdfBytes = await generateOrderReceiptPdf({
      tenantName: tenantDisplayName,
      customerReferenceName: parsed.data.customer_reference_name,
      orderNumber,
      orderDate,
      items,
      paymentSummary,
      paymentMethodLabel: buildPaymentMethodLabel({
        paymentMethod: parsed.data.paymentMethod,
        selectedInstallment,
        zeroCommissionApplied: paymentSummary.zeroCommissionApplied,
      }),
      note: parsed.data.note,
    });

    logOrderPdfServerEvent("info", "pdf_generated", {
      requestId,
      tenantId: tenant.id,
      orderNumber,
      pdfBytes: pdfBytes.byteLength,
    });

    const securePdfId = crypto.randomUUID();
    const { storagePath, publicUrl: pdfPublicUrl } = await uploadOrderReceiptPdf({
      supabase,
      tenantId: tenant.id,
      orderNumber,
      pdfBytes,
    });

    logOrderPdfServerEvent("info", "pdf_uploaded", {
      requestId,
      tenantId: tenant.id,
      orderNumber,
      storagePath,
    });

    await insertOrderReceiptRecord({
      supabase,
      securePdfId,
      tenantId: tenant.id,
      orderNumber,
      storagePath,
      pdfPublicUrl,
    });

    await recordStorefrontOrderStat(supabase, tenant.id, {
      catalogMode: false,
      currency: paymentSummary.currency,
      totalAmount: paymentSummary.finalTotal,
    });

    const pdfUrl = buildSecureOrderReceiptUrl(securePdfId, getPublicOrigin(request));
    const durationMs = Date.now() - startedAt;

    logOrderPdfServerEvent("info", "request_succeeded", {
      requestId,
      tenantId: tenant.id,
      orderNumber,
      securePdfId,
      durationMs,
    });

    return NextResponse.json({ pdfUrl, orderNumber, securePdfId, requestId });
  } catch (error) {
    logOrderPdfServerEvent("error", "request_failed", {
      requestId,
      tenantId: tenant.id,
      orderNumber,
      durationMs: Date.now() - startedAt,
      error: serializeOrderPdfError(error),
    });

    return errorResponse(requestId, "PDF oluşturulamadı.", 500, {
      reason: "pdf_pipeline_failed",
      tenantId: tenant.id,
      orderNumber,
    });
  }
}
