import { NextResponse } from "next/server";
import { shouldAllowDemoFallback } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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
        ...parsed.data,
      },
    });
  }

  const { data, error } = await supabase
    .from("tenants")
    .update(parsed.data)
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