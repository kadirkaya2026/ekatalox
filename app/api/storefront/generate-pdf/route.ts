import { NextResponse } from "next/server";
import { getStorefrontTenant, getTenantStorefrontSettings } from "@/lib/data";
import { getCartPaymentSummary } from "@/lib/storefront/cart";
import { generateOrderReceiptPdf } from "@/lib/storefront/order-receipt-pdf";
import {
  buildOrderReceiptOrderNumber,
  uploadOrderReceiptPdf,
} from "@/lib/storage/order-receipts";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = storefrontOrderPdfSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Sipariş verisi hatalı." },
      { status: 400 },
    );
  }

  const tenant = await getStorefrontTenant(parsed.data.subdomain);

  if (!tenant || tenant.status !== "active") {
    return NextResponse.json({ error: "Mağaza bulunamadı." }, { status: 404 });
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Sunucu yapılandırması eksik." },
      { status: 500 },
    );
  }

  const items = parsed.data.items as CartItem[];
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
    parsed.data.paymentMethod,
    cashConfig,
    cardConfig,
    selectedInstallment,
  );

  if (!paymentSummary) {
    return NextResponse.json(
      { error: "Sepet özeti hesaplanamadı. Tek para birimi kullanın." },
      { status: 400 },
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

    const pdfUrl = await uploadOrderReceiptPdf({
      supabase,
      tenantId: tenant.id,
      orderNumber,
      pdfBytes,
    });

    return NextResponse.json({ pdfUrl, orderNumber });
  } catch (error) {
    console.error("[generate-pdf] PDF üretimi veya yükleme hatası:", error);
    return NextResponse.json(
      { error: "PDF oluşturulamadı." },
      { status: 500 },
    );
  }
}
