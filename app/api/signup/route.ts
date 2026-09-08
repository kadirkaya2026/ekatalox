// Kendi kendine kayıt: mağaza + hesap anında açılır (kullanıcı kararı, 8 Eyl 2026).
import { NextResponse } from "next/server";
import { isRateLimited } from "@/lib/api/rate-limit";
import { createSelfServiceTenant } from "@/lib/signup/create-tenant";
import { getClientIp } from "@/lib/storefront/client-ip";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (ip && isRateLimited(`signup:${ip}`, 5, 60 * 60_000)) {
    return NextResponse.json({ error: "Çok fazla deneme. Lütfen bir süre sonra tekrar deneyin." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Form bilgileri okunamadı." }, { status: 400 });
  }

  const result = await createSelfServiceTenant(body, {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent"),
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error, field: result.field }, { status: result.status });
  }

  return NextResponse.json(
    { storeUrl: result.storeUrl, panelUrl: result.panelUrl, subdomain: result.subdomain, trialEndsAt: result.trialEndsAt },
    { status: 201 },
  );
}
