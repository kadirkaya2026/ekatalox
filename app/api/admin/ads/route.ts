import { NextResponse } from "next/server";
import { storefrontAdsConfigSchema } from "@/lib/ads/config";
import { getStorefrontAdsConfig, saveStorefrontAdsConfig } from "@/lib/ads/server";
import { getSessionContext } from "@/lib/auth/session";
import { ensureSuperAdminResponse } from "@/lib/tenancy/guards";

// eKatalox reklam yerleşimleri — yalnız süper admin okur/yazar.
export async function GET() {
  const guard = await ensureSuperAdminResponse();
  if (guard) {
    return guard;
  }

  return NextResponse.json({ config: await getStorefrontAdsConfig() });
}

export async function PUT(request: Request) {
  const guard = await ensureSuperAdminResponse();
  if (guard) {
    return guard;
  }

  const body = await request.json().catch(() => null);
  const parsed = storefrontAdsConfigSchema.safeParse(body ?? {});

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path?.length ? `${issue.path.join(".")}: ` : "";
    return NextResponse.json({ error: `${path}${issue?.message ?? "Geçersiz reklam ayarı."}` }, { status: 400 });
  }

  const session = await getSessionContext();
  const result = await saveStorefrontAdsConfig(parsed.data, session.profile?.id ?? null);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ config: parsed.data });
}
