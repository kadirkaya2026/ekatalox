import { NextResponse } from "next/server";
import { recordStorefrontPresence } from "@/lib/analytics/record-stats";
import { getStorefrontTenant } from "@/lib/data";
import { readStorefrontPriceList } from "@/lib/storefront/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Storefront heartbeat. The client sends only its visitor key + subdomain;
 * the current price list is read from the httpOnly tier cookie server-side.
 * Only logged-in visitors (with a price list) are recorded as "online".
 */
export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const payload = (body ?? {}) as { subdomain?: unknown; visitorKey?: unknown };
  const subdomain = String(payload.subdomain ?? "").trim().toLowerCase();
  const visitorKey = String(payload.visitorKey ?? "").trim();

  if (!subdomain || !visitorKey || visitorKey.length > 64) {
    return new NextResponse(null, { status: 204 });
  }

  const tenant = await getStorefrontTenant(subdomain);

  if (!tenant || tenant.status !== "active") {
    return new NextResponse(null, { status: 204 });
  }

  const priceListState = await readStorefrontPriceList(subdomain);

  // Not logged in (no access code entered yet) → not tracked as online.
  if (
    !priceListState?.priceListId ||
    priceListState.tenantId !== tenant.id
  ) {
    return new NextResponse(null, { status: 204 });
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return new NextResponse(null, { status: 204 });
  }

  await recordStorefrontPresence(
    supabase,
    tenant.id,
    visitorKey,
    priceListState.priceListId,
  );

  return new NextResponse(null, { status: 204 });
}
