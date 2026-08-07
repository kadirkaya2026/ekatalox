import { NextResponse } from "next/server";
import { generateTemporaryPassword } from "@/lib/auth/password";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureSuperAdminResponse } from "@/lib/tenancy/guards";

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/admin/tenants/[id]/create-admin">,
) {
  const guard = await ensureSuperAdminResponse();
  if (guard) {
    return guard;
  }

  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const fullName = typeof body.full_name === "string" ? body.full_name.trim() : null;

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "Geçerli bir e-posta adresi girin." },
      { status: 400 },
    );
  }

  const { id } = await ctx.params;
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase production yapılandırması eksik." },
      { status: 500 },
    );
  }

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, company_name")
    .eq("id", id)
    .maybeSingle();

  if (tenantError || !tenant) {
    return NextResponse.json({ error: "Tenant bulunamadı." }, { status: 404 });
  }

  const { data: memberships, error: membershipsError } = await supabase
    .from("tenant_memberships")
    .select("user_id")
    .eq("tenant_id", id);

  if (membershipsError) {
    return NextResponse.json(
      { error: "Tenant üyeleri okunamadı." },
      { status: 400 },
    );
  }

  const membershipUserIds = (
    (memberships as Array<{ user_id: string }> | null) ?? []
  ).map((membership) => membership.user_id);

  if (membershipUserIds.length) {
    const { data: existingAdminProfiles } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "tenant_admin")
      .in("id", membershipUserIds);

    if ((existingAdminProfiles as Array<{ id: string }> | null)?.length) {
      return NextResponse.json(
        { error: "Bu tenant için zaten bir yönetici hesabı var." },
        { status: 400 },
      );
    }
  }

  const temporaryPassword = generateTemporaryPassword();

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: {
      full_name: fullName ?? tenant.company_name,
    },
  });

  if (authError || !authUser.user) {
    return NextResponse.json(
      { error: authError?.message ?? "Yönetici hesabı oluşturulamadı." },
      { status: 400 },
    );
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: authUser.user.id,
    full_name: fullName,
    role: "tenant_admin",
    must_change_password: true,
  });

  if (profileError) {
    await supabase.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json(
      { error: "Yönetici profili oluşturulamadı." },
      { status: 400 },
    );
  }

  const { error: membershipError } = await supabase.from("tenant_memberships").insert({
    tenant_id: id,
    user_id: authUser.user.id,
  });

  if (membershipError) {
    await supabase.from("profiles").delete().eq("id", authUser.user.id);
    await supabase.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json(
      { error: "Yönetici üyeliği oluşturulamadı." },
      { status: 400 },
    );
  }

  return NextResponse.json({
    email,
    temporaryPassword,
  });
}
