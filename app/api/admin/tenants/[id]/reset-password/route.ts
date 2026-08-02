import { NextResponse } from "next/server";
import { generateTemporaryPassword } from "@/lib/auth/password";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureSuperAdminResponse } from "@/lib/tenancy/guards";

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/admin/tenants/[id]/reset-password">,
) {
  const guard = await ensureSuperAdminResponse();
  if (guard) {
    return guard;
  }

  const { id } = await ctx.params;
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase production yapılandırması eksik." },
      { status: 500 },
    );
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

  if (!membershipUserIds.length) {
    return NextResponse.json(
      { error: "Bu tenant için bir yönetici hesabı bulunamadı." },
      { status: 404 },
    );
  }

  const { data: profileRows, error: profilesError } = await supabase
    .from("profiles")
    .select("id, role")
    .in("id", membershipUserIds);

  if (profilesError) {
    return NextResponse.json(
      { error: "Tenant yönetici profili okunamadı." },
      { status: 400 },
    );
  }

  const tenantAdminUserId = (
    (profileRows as Array<{ id: string; role: string }> | null) ?? []
  ).find((profile) => profile.role === "tenant_admin")?.id;

  if (!tenantAdminUserId) {
    return NextResponse.json(
      { error: "Bu tenant için bir yönetici hesabı bulunamadı." },
      { status: 404 },
    );
  }

  const temporaryPassword = generateTemporaryPassword();

  const { data: updatedUser, error: updateError } =
    await supabase.auth.admin.updateUserById(tenantAdminUserId, {
      password: temporaryPassword,
    });

  if (updateError || !updatedUser.user) {
    return NextResponse.json(
      { error: "Şifre sıfırlanamadı." },
      { status: 400 },
    );
  }

  await supabase
    .from("profiles")
    .update({ must_change_password: true })
    .eq("id", tenantAdminUserId);

  return NextResponse.json({
    email: updatedUser.user.email,
    temporaryPassword,
  });
}
