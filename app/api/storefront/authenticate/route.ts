import { NextResponse } from "next/server";
import { recordStorefrontPriceListLogin } from "@/lib/analytics/record-stats";
import { isGateLocked, recordGateFailure } from "@/lib/api/shared-rate-limit";
import { validateAccessCode } from "@/lib/data";
import { getTrustedClientIp } from "@/lib/storefront/client-ip";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  clearStorefrontPriceListCookie,
  isSecureStorefrontRequest,
  setStorefrontPriceListCookie,
} from "@/lib/storefront/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const subdomain = String(body.subdomain ?? "").trim().toLowerCase();
  const code = String(body.code ?? "").trim();
  const secure = isSecureStorefrontRequest(request);

  if (!subdomain || !code) {
    return NextResponse.json(
      { error: "Subdomain ve şifre kodu zorunludur." },
      { status: 400 },
    );
  }

  // Deneme sınırı: yanlış kodlar IP ve mağaza başına DB'de sayılır; sınır
  // dolduysa kod hiç denenmez (doğru kod da 429 alır — yoksa sınır anlamsız).
  const supabase = createSupabaseAdminClient();
  const ip = getTrustedClientIp(request);

  if (supabase && (await isGateLocked(supabase, subdomain, ip))) {
    return NextResponse.json(
      { error: "Çok fazla hatalı deneme yapıldı. Lütfen 15 dakika sonra tekrar deneyin." },
      { status: 429 },
    );
  }

  const matched = await validateAccessCode({ subdomain, code });

  if (!matched) {
    if (supabase) {
      await recordGateFailure(supabase, subdomain, ip);
    }
    const response = NextResponse.json(
      { error: "Girilen şifre kodu geçersiz." },
      { status: 401 },
    );
    clearStorefrontPriceListCookie({ response, subdomain, secure });
    return response;
  }

  const response = NextResponse.json({
    success: true,
    priceListId: matched.priceListId,
    isCatalogOnly: matched.isCatalogOnly,
    priceListName: matched.priceListName,
    tenant: {
      id: matched.tenant.id,
      company_name: matched.tenant.company_name,
      subdomain: matched.tenant.subdomain,
    },
  });
  setStorefrontPriceListCookie({
    response,
    tenantId: matched.tenant.id,
    subdomain,
    priceListId: matched.priceListId,
    isCatalogOnly: matched.isCatalogOnly,
    accessCodeId: matched.accessCodeId,
    secure,
  });

  if (supabase) {
    await recordStorefrontPriceListLogin(
      supabase,
      matched.tenant.id,
      matched.priceListId,
      matched.accessCodeId,
    );
  }

  return response;
}
