import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { shouldAllowDemoFallback } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSessionContext } from "@/lib/auth/session";
import {
  getBannerObjectPath,
  STOREFRONT_BANNERS_BUCKET,
} from "@/lib/storage/banners";
import { revalidateStorefrontCache } from "@/lib/storefront/cache";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { normalizeCategoryName } from "@/lib/categories/ensure-hierarchy";
// Silinen kategorinin ürünlerinin düştüğü kova. products.category_id NOT NULL
// olduğu için ürünler "gerçekten kategorisiz" kalamaz; tenant'ın kök
// seviyedeki "Kategorisiz" kategorisine taşınır (yoksa oluşturulur). Vitrin
// bu kovayı kategori menüsünde göstermez (bkz. lib/categories/tree.ts).
import { UNCATEGORIZED_CATEGORY_NAME } from "@/lib/categories/tree";
import type { BannerItem, Category } from "@/lib/types";
import { categorySchema } from "@/lib/validators/category";

export async function POST(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const body = await request.json();
  const parsed = categorySchema.safeParse({
    ...body,
    tenant_id: session.tenant!.id,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Kategori verisi hatalı." },
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

    return NextResponse.json({
      category: {
        id: randomUUID(),
        parent_id: parsed.data.parent_id ?? null,
        display_order: 0,
        banner_item: null,
        created_at: new Date().toISOString(),
        ...parsed.data,
      },
    });
  }

  if (parsed.data.parent_id) {
    const { data: parentCategory } = await supabase
      .from("categories")
      .select("id")
      .eq("id", parsed.data.parent_id)
      .eq("tenant_id", session.tenant!.id)
      .maybeSingle();

    if (!parentCategory) {
      return NextResponse.json(
        { error: "Seçilen üst kategori bulunamadı." },
        { status: 400 },
      );
    }
  }

  const { data: lastCategory } = await supabase
    .from("categories")
    .select("display_order")
    .eq("tenant_id", session.tenant!.id)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("categories")
    .insert({
      ...parsed.data,
      parent_id: parsed.data.parent_id ?? null,
      display_order: (lastCategory?.display_order ?? 0) + 1,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Bu isimde bir kategori zaten mevcut. Farklı bir isim deneyin." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ category: data });
}

export async function PATCH(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const { id, name } = await request.json();

  if (!id || !name?.trim()) {
    return NextResponse.json(
      { error: "Kategori id ve yeni isim gereklidir." },
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

  const { data, error } = await supabase
    .from("categories")
    .update({ name: name.trim() })
    .eq("id", id)
    .eq("tenant_id", session.tenant!.id)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Bu isimde bir kategori zaten mevcut. Farklı bir isim deneyin." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ category: data });
}

export async function DELETE(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const { id } = await request.json();

  if (!id) {
    return NextResponse.json(
      { error: "Silinecek kategori seçilmedi." },
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

  const { count: childCount } = await supabase
    .from("categories")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", session.tenant!.id)
    .eq("parent_id", id);

  if ((childCount ?? 0) > 0) {
    return NextResponse.json(
      { error: "Bu kategoriye bağlı alt kategoriler olduğu için silinemez." },
      { status: 400 },
    );
  }

  const { data: categoryToDelete } = await supabase
    .from("categories")
    .select("name, banner_item, tile_image_url")
    .eq("id", id)
    .eq("tenant_id", session.tenant!.id)
    .maybeSingle();

  if (!categoryToDelete) {
    return NextResponse.json({ error: "Kategori bulunamadı." }, { status: 404 });
  }

  const { count: productCount } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", session.tenant!.id)
    .eq("category_id", id);

  const movedCount = productCount ?? 0;
  let uncategorizedCategory: Category | null = null;
  let createdUncategorized = false;

  if (movedCount > 0) {
    // Ürünler "Kategorisiz" kovasına taşınır; ürün fiyatları/stokları değişmez,
    // vitrinde kategori ataması olmadan yayınlanmaya devam ederler.
    const isDeletingUncategorizedBucket =
      normalizeCategoryName(categoryToDelete.name as string) ===
      normalizeCategoryName(UNCATEGORIZED_CATEGORY_NAME);

    if (isDeletingUncategorizedBucket) {
      return NextResponse.json(
        {
          error:
            '"Kategorisiz" kategorisi içinde ürün varken silinemez. Önce ürünleri başka bir kategoriye taşıyın.',
        },
        { status: 400 },
      );
    }

    const { data: existingBucket } = await supabase
      .from("categories")
      .select("*")
      .eq("tenant_id", session.tenant!.id)
      .is("parent_id", null)
      .ilike("name", UNCATEGORIZED_CATEGORY_NAME)
      .limit(1)
      .maybeSingle<Category>();

    uncategorizedCategory = existingBucket ?? null;

    if (!uncategorizedCategory) {
      const { data: lastCategory } = await supabase
        .from("categories")
        .select("display_order")
        .eq("tenant_id", session.tenant!.id)
        .order("display_order", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: createdBucket, error: createError } = await supabase
        .from("categories")
        .insert({
          tenant_id: session.tenant!.id,
          name: UNCATEGORIZED_CATEGORY_NAME,
          parent_id: null,
          display_order: (lastCategory?.display_order ?? 0) + 1,
          // Silinen kategorinin ürünleri vitrinde yayınlanmaya devam etmeli;
          // bu yüzden kova gizli oluşturulmaz (import'un kovasından farklı).
          is_hidden_from_storefront: false,
        })
        .select("*")
        .single<Category>();

      if (createError || !createdBucket) {
        return NextResponse.json(
          { error: createError?.message ?? '"Kategorisiz" kategorisi oluşturulamadı.' },
          { status: 400 },
        );
      }

      uncategorizedCategory = createdBucket;
      createdUncategorized = true;
    }

    const { error: moveError } = await supabase
      .from("products")
      .update({ category_id: uncategorizedCategory.id })
      .eq("tenant_id", session.tenant!.id)
      .eq("category_id", id);

    if (moveError) {
      return NextResponse.json({ error: moveError.message }, { status: 400 });
    }
  }

  const bannerItem = categoryToDelete?.banner_item as BannerItem | null;
  const bannerImageUrl = bannerItem?.image_url ?? null;
  const tileImageUrl = (categoryToDelete?.tile_image_url as string | null) ?? null;

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("tenant_id", session.tenant!.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (bannerImageUrl) {
    const objectPath = getBannerObjectPath(bannerImageUrl);

    if (objectPath?.startsWith(`${session.tenant!.id}/`)) {
      await supabase.storage.from(STOREFRONT_BANNERS_BUCKET).remove([objectPath]);
    }
  }

  if (tileImageUrl) {
    const objectPath = getBannerObjectPath(tileImageUrl);

    if (objectPath?.startsWith(`${session.tenant!.id}/`)) {
      await supabase.storage.from(STOREFRONT_BANNERS_BUCKET).remove([objectPath]);
    }
  }

  revalidateStorefrontCache({
    tenantId: session.tenant!.id,
    subdomain: session.tenant!.subdomain,
  });

  return NextResponse.json({
    success: true,
    movedCount,
    uncategorizedCategory: createdUncategorized ? uncategorizedCategory : null,
    uncategorizedHidden: uncategorizedCategory?.is_hidden_from_storefront ?? false,
  });
}
