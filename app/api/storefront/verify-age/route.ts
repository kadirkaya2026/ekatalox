import { NextResponse } from "next/server";
import { getStorefrontTenant } from "@/lib/data";
import {
  isSecureStorefrontRequest,
  setStorefrontAgeVerifiedCookie,
} from "@/lib/storefront/session";

// Yaş doğrulama gate'inde "Evet, 18 yaşından büyüğüm" onayı buraya POST
// eder; tenant subdomain'ine özel bir çerez kurulur (proxy.ts sadece
// varlığına bakar, bkz. tier-cookie.ts).
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const subdomain = typeof body?.subdomain === "string" ? body.subdomain.trim().toLowerCase() : "";

  if (!subdomain) {
    return NextResponse.json({ error: "Mağaza bulunamadı." }, { status: 400 });
  }

  const tenant = await getStorefrontTenant(subdomain);

  if (!tenant) {
    return NextResponse.json({ error: "Mağaza bulunamadı." }, { status: 404 });
  }

  const response = NextResponse.json({ success: true });
  setStorefrontAgeVerifiedCookie({
    response,
    subdomain,
    secure: isSecureStorefrontRequest(request),
  });

  return response;
}
