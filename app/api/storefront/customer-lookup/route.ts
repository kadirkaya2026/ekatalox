import { NextResponse } from "next/server";
import { getStorefrontTenant } from "@/lib/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isLikelyCompletePhone, normalizeCustomerPhone } from "@/lib/storefront/customer-phone";
import { getClientIp } from "@/lib/storefront/client-ip";

// Telefonla otomatik doldurma: tam numara eşleşmesinde önceki sipariş
// bilgisini döner. Bir müşterinin başka müşterinin bilgisini görebilmesi
// (numara taraması/enumeration) riskine karşı IP bazlı basit bir rate limit
// uygulanıyor — proxy.ts'deki tenantLookupCache ile aynı üslup, bellek içi.
const RATE_LIMIT_WINDOW_MS = 5 * 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const RATE_LIMIT_MAX_ENTRIES = 2000;
const rateLimitCache = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitCache.get(key);

  if (!entry || entry.resetAt <= now) {
    if (rateLimitCache.size >= RATE_LIMIT_MAX_ENTRIES) {
      rateLimitCache.clear();
    }
    rateLimitCache.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  entry.count += 1;
  return false;
}


export async function GET(request: Request) {
  const url = new URL(request.url);
  const subdomain = url.searchParams.get("subdomain")?.trim().toLowerCase() ?? "";
  const rawPhone = url.searchParams.get("phone")?.trim() ?? "";

  if (!subdomain || !isLikelyCompletePhone(rawPhone)) {
    return NextResponse.json({ customer: null });
  }

  const ip = getClientIp(request) ?? "unknown";
  if (isRateLimited(`${ip}:${subdomain}`)) {
    return NextResponse.json({ error: "Çok fazla istek." }, { status: 429 });
  }

  const tenant = await getStorefrontTenant(subdomain);

  if (!tenant || tenant.status !== "active" || tenant.business_type !== "market") {
    return NextResponse.json({ customer: null });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ customer: null });
  }

  const phone = normalizeCustomerPhone(rawPhone);
  const { data } = await supabase
    .from("customers")
    .select("full_name, address")
    .eq("tenant_id", tenant.id)
    .eq("phone", phone)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ customer: null });
  }

  return NextResponse.json({
    customer: { full_name: data.full_name, address: data.address },
  });
}
