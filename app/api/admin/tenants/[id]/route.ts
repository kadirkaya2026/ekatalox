import { NextResponse } from "next/server";
import { extendPlanExpiry } from "@/lib/billing/membership";
import { shouldAllowDemoFallback } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PRODUCT_IMAGES_BUCKET } from "@/lib/storage/product-images";
import { getStorageObjectPathFromPublicUrl } from "@/lib/storage/storage-helpers";
import { ensureSuperAdminResponse } from "@/lib/tenancy/guards";
import { tenantUpdateSchema } from "@/lib/validators/tenant";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/admin/tenants/[id]">,
) {
  const guard = await ensureSuperAdminResponse();
  if (guard) {
    return guard;
  }

  const { id } = await ctx.params;
  const body = await request.json();
  const parsed = tenantUpdateSchema.safeParse({
    ...body,
    max_product_limit: body.max_product_limit
      ? Number(body.max_product_limit)
      : undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Güncelleme verisi hatalı." },
      { status: 400 },
    );
  }

  // gift_months DB kolonu değil; mevcut bitiş tarihine göre hesaplanıp
  // plan_expires_at'e çevrilir.
  const { gift_months, ...updates } = parsed.data as typeof parsed.data & {
    gift_months?: number;
  };

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return NextResponse.json(
        { error: "Supabase production yapılandırması eksik." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      tenant: {
        id,
        ...updates,
        ...(gift_months
          ? { plan_expires_at: extendPlanExpiry(null, gift_months) }
          : {}),
      },
    });
  }

  const updatePayload: Record<string, unknown> = { ...updates };

  if (updatePayload.custom_domain) {
    const { data: existingTenant } = await supabase
      .from("tenants")
      .select("id")
      .ilike("custom_domain", updatePayload.custom_domain as string)
      .neq("id", id)
      .maybeSingle();

    if (existingTenant) {
      return NextResponse.json(
        { error: "Bu alan adı başka bir mağaza tarafından kullanılıyor." },
        { status: 409 },
      );
    }
  }

  if (gift_months) {
    const { data: currentTenant } = await supabase
      .from("tenants")
      .select("plan_expires_at")
      .eq("id", id)
      .maybeSingle();

    updatePayload.plan_expires_at = extendPlanExpiry(
      (currentTenant?.plan_expires_at as string | null) ?? null,
      gift_months,
    );
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json(
      { error: "Güncellenecek alan bulunamadı." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("tenants")
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Tenant güncellenemedi." },
      { status: 400 },
    );
  }

  return NextResponse.json({ tenant: data });
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/admin/tenants/[id]">,
) {
  const guard = await ensureSuperAdminResponse();
  if (guard) {
    return guard;
  }

  const { id } = await ctx.params;
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return NextResponse.json(
        { error: "Supabase production yapılandırması eksik." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  }

  const [{ data: productRows, error: productsError }, { data: membershipRows, error: membershipsError }] =
    await Promise.all([
      supabase.from("products").select("image_url").eq("tenant_id", id),
      supabase.from("tenant_memberships").select("user_id").eq("tenant_id", id),
    ]);

  if (productsError || membershipsError) {
    return NextResponse.json(
      { error: "Tenant verileri silme öncesi okunamadı." },
      { status: 400 },
    );
  }

  const imagePaths = Array.from(
    new Set(
      ((productRows as Array<{ image_url: string | null }> | null) ?? [])
        .map((product) =>
          getStorageObjectPathFromPublicUrl(product.image_url, PRODUCT_IMAGES_BUCKET),
        )
        .filter((path): path is string => Boolean(path)),
    ),
  );

  if (imagePaths.length) {
    const { error: storageError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .remove(imagePaths);

    if (storageError) {
      return NextResponse.json(
        { error: "Tenant görselleri silinemedi." },
        { status: 400 },
      );
    }
  }

  const membershipUserIds = Array.from(
    new Set(
      ((membershipRows as Array<{ user_id: string }> | null) ?? []).map(
        (membership) => membership.user_id,
      ),
    ),
  );

  let deletableUserIds: string[] = [];

  if (membershipUserIds.length) {
    const [{ data: allMembershipRows, error: allMembershipsError }, { data: profileRows, error: profilesError }] =
      await Promise.all([
        supabase
          .from("tenant_memberships")
          .select("user_id")
          .in("user_id", membershipUserIds),
        supabase.from("profiles").select("id, role").in("id", membershipUserIds),
      ]);

    if (allMembershipsError || profilesError) {
      return NextResponse.json(
        { error: "Tenant kullanıcıları silme öncesi doğrulanamadı." },
        { status: 400 },
      );
    }

    const membershipCounts = ((allMembershipRows as Array<{ user_id: string }> | null) ?? []).reduce<
      Record<string, number>
    >((counts, membership) => {
      counts[membership.user_id] = (counts[membership.user_id] ?? 0) + 1;
      return counts;
    }, {});

    const profileMap = new Map(
      (((profileRows as Array<{ id: string; role: string }> | null) ?? [])).map((profile) => [
        profile.id,
        profile.role,
      ]),
    );

    deletableUserIds = membershipUserIds.filter(
      (userId) =>
        membershipCounts[userId] === 1 && profileMap.get(userId) === "tenant_admin",
    );
  }

  const [
    accessCodesDelete,
    productsDelete,
    categoriesDelete,
    membershipsDelete,
  ] = await Promise.all([
    supabase.from("access_codes").delete().eq("tenant_id", id),
    supabase.from("products").delete().eq("tenant_id", id),
    supabase.from("categories").delete().eq("tenant_id", id),
    supabase.from("tenant_memberships").delete().eq("tenant_id", id),
  ]);

  if (
    accessCodesDelete.error ||
    productsDelete.error ||
    categoriesDelete.error ||
    membershipsDelete.error
  ) {
    return NextResponse.json(
      { error: "Tenant ilişkili verileri silinemedi." },
      { status: 400 },
    );
  }

  const { error: tenantDeleteError } = await supabase.from("tenants").delete().eq("id", id);

  if (tenantDeleteError) {
    return NextResponse.json(
      { error: "Tenant silinemedi." },
      { status: 400 },
    );
  }

  for (const userId of deletableUserIds) {
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      return NextResponse.json(
        { error: "Tenant silindi ancak bağlı admin hesabı kaldırılamadı." },
        { status: 400 },
      );
    }
  }

  return NextResponse.json({ success: true });
}