import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { hasKurumsalSiteAccess } from "@/lib/kurumsal/domain";
import {
  DUPLICATE_PASSWORD_MESSAGE,
  dealerCustomerUpdateSchema,
  isDuplicatePasswordError,
} from "@/lib/kurumsal/dealer-customers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";

// Bayi müşterisi (kişiye özel şifre) düzenleme / silme. Silmek şifreyi
// iptal eder: müşteri artık o şifreyle giremez. Yalnız Kurumsal paket.

async function prepare(ctx: RouteContext<"/api/tenant/bayi-musteriler/[id]">) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) return { response: guard } as const;
  const session = await getSessionContext();
  const tenant = session.tenant!;
  if (!hasKurumsalSiteAccess(tenant)) {
    return {
      response: NextResponse.json({ error: "Bu özellik Kurumsal pakette kullanılabilir." }, { status: 403 }),
    } as const;
  }
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return { response: NextResponse.json({ error: "Müşteri bulunamadı." }, { status: 404 }) } as const;
  }
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return { response: NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 }) } as const;
  }
  return { tenant, id, supabase } as const;
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/tenant/bayi-musteriler/[id]">) {
  const prepared = await prepare(ctx);
  if ("response" in prepared) return prepared.response;
  const { tenant, id, supabase } = prepared;

  const parsed = dealerCustomerUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Bilgiler hatalı." }, { status: 400 });
  }
  const patch = Object.fromEntries(Object.entries(parsed.data).filter(([, value]) => value !== undefined));
  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "Değişiklik yok." }, { status: 400 });
  }
  if (patch.price_list_id) {
    const { data: list } = await supabase
      .from("price_lists")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("id", patch.price_list_id)
      .maybeSingle();
    if (!list) return NextResponse.json({ error: "Fiyat listesi bulunamadı." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("access_codes")
    .update(patch)
    .eq("tenant_id", tenant.id)
    .eq("id", id)
    .eq("is_personal", true)
    .select("id")
    .maybeSingle();
  if (error) {
    if (isDuplicatePasswordError(error)) {
      return NextResponse.json({ error: DUPLICATE_PASSWORD_MESSAGE }, { status: 409 });
    }
    console.error("[bayi-musteri] güncellenemedi:", error.message);
    return NextResponse.json({ error: "Müşteri güncellenemedi." }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Müşteri bulunamadı." }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/tenant/bayi-musteriler/[id]">) {
  const prepared = await prepare(ctx);
  if ("response" in prepared) return prepared.response;
  const { tenant, id, supabase } = prepared;

  const { data, error } = await supabase
    .from("access_codes")
    .delete()
    .eq("tenant_id", tenant.id)
    .eq("id", id)
    .eq("is_personal", true)
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("[bayi-musteri] silinemedi:", error.message);
    return NextResponse.json({ error: "Müşteri silinemedi." }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Müşteri bulunamadı." }, { status: 404 });
  return NextResponse.json({ success: true });
}
