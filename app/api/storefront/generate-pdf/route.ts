import { NextResponse, after } from "next/server";
import { sendDealerOrderPush } from "@/lib/push/send-dealer-push";
import { findActiveCouponForPhone } from "@/lib/coupons/data";
import { cookies } from "next/headers";
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
import { recordStorefrontOrder } from "@/lib/storefront/orders";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStorefrontMagnetCookieName } from "@/lib/storefront/magnet-cookie";
import { getClientIp } from "@/lib/storefront/client-ip";
import { checkOrderIpGuard, ipBlockedMessage } from "@/lib/storefront/ip-guard";
import { normalizeCustomerPhone } from "@/lib/storefront/customer-phone";
import { getPublicOrigin } from "@/lib/tenancy/request-host";
import { createShortLink } from "@/lib/storage/short-links";
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

// Kısa link üretimi sipariş akışını ASLA kırmamalı: kod üretilemezse uzun
// adrese düşülür, müşteri yine siparişini gönderebilir.
async function buildShortOrderLinks(params: {
  tenantId: string;
  origin: string;
  longPdfUrl: string;
  location: { lat: number; lng: number } | null;
}): Promise<{ pdfUrl: string; locationUrl: string | null }> {
  // Konum linki bilerek kısaltılmıyor: bayi mesajda doğrudan Google
  // adresini görsün ve telefonundaki harita uygulaması açılsın istiyoruz
  // (kullanıcı isteği, 6 Eyl 2026). Konum satırını istemci kendi üretiyor;
  // burada yalnızca sipariş fişi linki kısaltılıyor.
  try {
    const shortPdf = await createShortLink({
      tenantId: params.tenantId,
      targetUrl: params.longPdfUrl,
      origin: params.origin,
      kind: "order_pdf",
    });
    return { pdfUrl: shortPdf ?? params.longPdfUrl, locationUrl: null };
  } catch {
    return { pdfUrl: params.longPdfUrl, locationUrl: null };
  }
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

  // IP taşkın freni: aynı IP 10 dakikada 5'ten fazla deneme yaparsa 1 saat
  // engellenir; bayi panelden kaldırabilir/uzatabilir/süresize çevirebilir.
  const clientIp = getClientIp(request);
  const ipGuard = await checkOrderIpGuard(supabase, tenant.id, clientIp);
  if (ipGuard.blocked) {
    return errorResponse(requestId, ipBlockedMessage(ipGuard), 429, {
      reason: "ip_blocked",
      tenantId: tenant.id,
      permanent: ipGuard.permanent,
      blockedUntil: ipGuard.blockedUntil,
    });
  }

  // Engelli telefon: bayinin engellediği numaradan sipariş PDF üretilmeden
  // reddedilir (RPC içinde ikinci bir savunma katmanı daha var).
  const normalizedPhone = normalizeCustomerPhone(parsed.data.customer_phone);
  if (normalizedPhone) {
    const { data: blocked } = await supabase
      .from("blocked_customer_phones")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("phone", normalizedPhone)
      .maybeSingle();

    if (blocked) {
      return errorResponse(requestId, "Sipariş alınamadı. Lütfen mağaza ile iletişime geçin.", 403, {
        reason: "phone_blocked",
        tenantId: tenant.id,
      });
    }
  }

  // Magnet çerezi (proxy.ts set eder, HttpOnly — buradan başka okuyan yok).
  // Kod BU tenant'a atanmış değilse yok sayılır; sahiplenme RPC içinde,
  // sipariş insert'iyle aynı transaction'da yapılır.
  const magnetCodeId = await resolveMagnetCodeId(supabase, tenant.id, tenant.subdomain);

  const items = parsed.data.items as CartItem[];
  const catalogMode = parsed.data.catalog_mode;

  if (catalogMode) {
    // Fiyatsız katalogda da ödeme yöntemi seçilebilir (tutar hesabı yok, sadece bilgi).
    const catalogPaymentMethod = parsed.data.paymentMethod ?? null;
    const catalogPaymentMethodLabel =
      catalogPaymentMethod === "cash" ? "Nakit" : catalogPaymentMethod === "card" ? "Kredi Kartı" : null;
    const storefrontSettings = await getTenantStorefrontSettings(tenant.id);
    const tenantDisplayName =
      storefrontSettings.storefront_title?.trim() || tenant.company_name;
    const orderNumber = buildOrderReceiptOrderNumber(tenant.id);
    const orderDate = new Date();

    // Siparis kaydi PDF uretiminden ONCE yapiliyor. Eskiden try blogunun
    // icindeydi: pdf-lib bir sebeple patlarsa musteri WhatsApp'tan siparisi
    // gonderiyor ama sistemde hicbir kaydi olmuyordu.
    await recordStorefrontOrderStat(supabase, tenant.id, { catalogMode: true });
    const recorded = await recordStorefrontOrder({
      supabase,
      tenantId: tenant.id,
      customerName: parsed.data.customer_reference_name,
      customerPhone: parsed.data.customer_phone,
      customerAddress: parsed.data.customer_address,
      orderNumber,
      currency: "CATALOG",
      totalAmount: 0,
      paymentMethod: catalogPaymentMethod,
      items,
      note: parsed.data.note,
      magnetCodeId,
    });
    if (recorded) {
      const rec = recorded;
      after(() =>
        sendDealerOrderPush({
          tenantId: tenant.id,
          kind: "new",
          order: {
            id: rec.orderId,
            orderNo: rec.orderNo,
            customerName: parsed.data.customer_reference_name,
            itemCount: items.length,
            totalAmount: 0,
            currency: "CATALOG",
            paymentMethod: catalogPaymentMethod,
          },
        }).catch((err) => console.error("[dealer-push] hata:", err)),
      );
    }

    try {
      const pdfBytes = await generateOrderReceiptPdf({
        tenantName: tenantDisplayName,
        customerReferenceName: parsed.data.customer_reference_name,
        customerPhone: parsed.data.customer_phone,
        customerAddress: parsed.data.customer_address,
        orderNumber,
        orderNo: recorded?.orderNo ?? null,
        orderDate,
        items,
        paymentSummary: null,
        paymentMethodLabel: catalogPaymentMethodLabel,
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

      const origin = getPublicOrigin(request);
      const longPdfUrl = buildSecureOrderReceiptUrl(securePdfId, origin);
      const { pdfUrl, locationUrl } = await buildShortOrderLinks({
        tenantId: tenant.id,
        origin,
        longPdfUrl,
        location: parsed.data.customer_location ?? null,
      });
      return NextResponse.json({ pdfUrl, locationUrl, orderNumber, orderNo: recorded?.orderNo ?? null, securePdfId, requestId, trackingUrl: buildTrackingUrl(request, recorded) });
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

  const paymentMethod = parsed.data.paymentMethod ?? null;
  const activeInstallmentOptions = parsed.data.cardInstallmentOptions.filter(
    (option) => option.isActive,
  );
  const selectedInstallment =
    paymentMethod === "card" && parsed.data.selectedInstallmentCount !== null
      ? (activeInstallmentOptions.find(
          (option) => option.count === parsed.data.selectedInstallmentCount,
        ) ?? null)
      : null;

  const cashConfig =
    paymentMethod === "cash"
      ? {
          tiers: parsed.data.cashDiscountTiers,
          isActive: parsed.data.isCashDiscountActive,
        }
      : null;
  const cardConfig =
    paymentMethod === "card"
      ? {
          tiers: parsed.data.cardCampaignTiers,
          isActive: parsed.data.isCardCampaignActive,
        }
      : null;

  // Müşteriye özel kupon (telefona bağlı): istemcinin gösterdiğiyle aynı
  // kaynaktan, sunucuda yeniden bulunur — istemciye güvenilmez.
  const couponPhone = normalizeCustomerPhone(parsed.data.customer_phone ?? "");
  const coupon = couponPhone.length >= 10 ? await findActiveCouponForPhone(supabase, tenant.id, couponPhone) : null;

  // Getirme ücreti ayarını sunucudan oku (istemciye güvenilmez, kupon gibi).
  // Yalnız market tenantlarda uygulanır.
  const deliveryFeeSettings = await getTenantStorefrontSettings(tenant.id);
  const deliveryFeeConfig =
    tenant.business_type === "market" && deliveryFeeSettings.is_delivery_fee_active
      ? {
          isActive: true,
          amount: deliveryFeeSettings.delivery_fee_amount ?? 0,
          freeThreshold: deliveryFeeSettings.delivery_fee_free_threshold ?? 0,
        }
      : null;

  const paymentSummary = getCartPaymentSummary(
    items,
    paymentMethod ?? "cash",
    cashConfig,
    cardConfig,
    selectedInstallment,
    [],
    undefined,
    coupon,
    deliveryFeeConfig,
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

  // Siparis kaydi PDF uretiminden ONCE (bkz. katalog dalindaki not).
  await recordStorefrontOrderStat(supabase, tenant.id, {
    catalogMode: false,
    currency: paymentSummary.currency,
    totalAmount: paymentSummary.finalTotal,
  });
  const recorded = await recordStorefrontOrder({
    supabase,
    tenantId: tenant.id,
    customerName: parsed.data.customer_reference_name,
    customerPhone: parsed.data.customer_phone,
    customerAddress: parsed.data.customer_address,
    orderNumber,
    currency: paymentSummary.currency,
    totalAmount: paymentSummary.finalTotal,
    paymentMethod,
    items,
    note: parsed.data.note,
    magnetCodeId,
  });
  if (recorded && paymentSummary.appliedCoupon && paymentSummary.couponDiscountAmount > 0) {
    // Kuponu tüket ve siparişe işle (atomik; ikinci kullanımda false döner)
    await supabase.rpc("redeem_customer_coupon", {
      p_tenant_id: tenant.id,
      p_coupon_id: paymentSummary.appliedCoupon.id,
      p_order_id: recorded.orderId,
      p_discount: paymentSummary.couponDiscountAmount,
    });
  }
  if (recorded) {
    const rec = recorded;
    after(() =>
      sendDealerOrderPush({
        tenantId: tenant.id,
        kind: "new",
        order: {
          id: rec.orderId,
          orderNo: rec.orderNo,
          customerName: parsed.data.customer_reference_name,
          itemCount: items.length,
          totalAmount: paymentSummary.finalTotal,
          currency: paymentSummary.currency,
          paymentMethod,
        },
      }).catch((err) => console.error("[dealer-push] hata:", err)),
    );
  }

  try {
    const pdfBytes = await generateOrderReceiptPdf({
      tenantName: tenantDisplayName,
      customerReferenceName: parsed.data.customer_reference_name,
      customerPhone: parsed.data.customer_phone,
      customerAddress: parsed.data.customer_address,
      orderNumber,
      orderNo: recorded?.orderNo ?? null,
      orderDate,
      items,
      paymentSummary,
      paymentMethodLabel: paymentMethod
        ? buildPaymentMethodLabel({
            paymentMethod,
            selectedInstallment,
            zeroCommissionApplied: paymentSummary.zeroCommissionApplied,
          })
        : null,
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

    const origin = getPublicOrigin(request);
    const longPdfUrl = buildSecureOrderReceiptUrl(securePdfId, origin);
    const { pdfUrl, locationUrl } = await buildShortOrderLinks({
      tenantId: tenant.id,
      origin,
      longPdfUrl,
      location: parsed.data.customer_location ?? null,
    });
    const durationMs = Date.now() - startedAt;

    logOrderPdfServerEvent("info", "request_succeeded", {
      requestId,
      tenantId: tenant.id,
      orderNumber,
      securePdfId,
      durationMs,
    });

    return NextResponse.json({ pdfUrl, locationUrl, orderNumber, orderNo: recorded?.orderNo ?? null, securePdfId, requestId, trackingUrl: buildTrackingUrl(request, recorded) });
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

/**
 * Magnet çerezindeki kodu bu tenant'ın magnet_codes satırına çözer.
 * Kod yoksa, geçersizse veya BAŞKA bayiye aitse null — sipariş akışını
 * hiçbir koşulda bozmaz.
 */
async function resolveMagnetCodeId(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  tenantId: string,
  subdomain: string,
): Promise<string | null> {
  try {
    const store = await cookies();
    const raw = store.get(getStorefrontMagnetCookieName(subdomain))?.value?.trim().toLowerCase();
    if (!raw || !/^[a-z0-9]{4,16}$/.test(raw)) return null;

    const { data } = await supabase
      .from("magnet_codes")
      .select("id")
      .eq("tenant_id", tenantId)
      .ilike("code", raw)
      .maybeSingle();

    return data?.id ?? null;
  } catch {
    return null;
  }
}

/** Müşterinin girişsiz sipariş takip sayfası (vitrin host'unda, gate'siz). */
function buildTrackingUrl(
  request: Request,
  recorded: { trackingToken: string | null } | null,
): string | null {
  if (!recorded?.trackingToken) return null;
  return `${getPublicOrigin(request)}/siparis/${recorded.trackingToken}`;
}
