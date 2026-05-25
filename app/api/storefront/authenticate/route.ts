import { NextResponse } from "next/server";
import { validateAccessCode } from "@/lib/data";
import { clearStorefrontTier, writeStorefrontTier } from "@/lib/storefront/session";

export async function POST(request: Request) {
  const body = await request.json();
  const subdomain = String(body.subdomain ?? "").trim().toLowerCase();
  const code = String(body.code ?? "").trim();

  if (!subdomain || !code) {
    return NextResponse.json(
      { error: "Subdomain ve şifre kodu zorunludur." },
      { status: 400 },
    );
  }

  const matched = await validateAccessCode({ subdomain, code });

  if (!matched) {
    await clearStorefrontTier(subdomain);
    return NextResponse.json(
      { error: "Girilen şifre kodu geçersiz." },
      { status: 401 },
    );
  }

  await writeStorefrontTier(subdomain, matched.tierLevel);

  return NextResponse.json({
    success: true,
    tierLevel: matched.tierLevel,
    tenant: {
      id: matched.tenant.id,
      company_name: matched.tenant.company_name,
      subdomain: matched.tenant.subdomain,
    },
  });
}