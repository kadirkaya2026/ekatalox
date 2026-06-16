import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { shouldAllowDemoFallback } from "@/lib/env";
import { revalidateStorefrontCache } from "@/lib/storefront/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getBannerObjectPath,
  STOREFRONT_BANNERS_BUCKET,
} from "@/lib/storage/banners";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import type { BannerItem } from "@/lib/types";
import { categoryBannerUpdateSchema } from "@/lib/validators/category-banner";

function isManagedBannerUrl(url: string | null, tenantId: string) {
  const objectPath = getBannerObjectPath(url);

  if (!objectPath) {
    return false;
  }

  return objectPath.startsWith(`${tenantId}/`);
}

export async function PATCH(request: Request) {
  const guard = await ensureTenantAdminResponse();
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const body = await request.json();
  const parsed = categoryBannerUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Kategori banner verisi hatalı." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return NextResponse.json(
        { error: "Sunucu yapılandırması eksik." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  }

  const { data: existingCategory } = await supabase
    .from("categories")
    .select("banner_item")
    .eq("id", parsed.data.id)
    .eq("tenant_id", session.tenant!.id)
    .maybeSingle();

  if (!existingCategory) {
    return NextResponse.json({ error: "Kategori bulunamadı." }, { status: 404 });
  }

  const previousBanner = existingCategory.banner_item as BannerItem | null;
  const nextBanner = parsed.data.banner_item
    ? {
        ...parsed.data.banner_item,
        cta_label: null,
        cta_href: null,
      }
    : null;

  const { data, error } = await supabase
    .from("categories")
    .update({ banner_item: nextBanner })
    .eq("id", parsed.data.id)
    .eq("tenant_id", session.tenant!.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const previousImageUrl = previousBanner?.image_url ?? null;
  const nextImageUrl = nextBanner?.image_url ?? null;

  if (
    previousImageUrl &&
    previousImageUrl !== nextImageUrl &&
    isManagedBannerUrl(previousImageUrl, session.tenant!.id)
  ) {
    const previousPath = getBannerObjectPath(previousImageUrl);

    if (previousPath) {
      await supabase.storage.from(STOREFRONT_BANNERS_BUCKET).remove([previousPath]);
    }
  }

  revalidateStorefrontCache({
    tenantId: session.tenant!.id,
    subdomain: session.tenant!.subdomain,
  });

  return NextResponse.json({ category: data });
}
