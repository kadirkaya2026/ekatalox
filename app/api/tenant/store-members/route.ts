import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hashMemberPassword } from "@/lib/storefront/member";

// Market/tekel vitrin üyeleri (0180). Şifresini unutan ve e-posta eklememiş
// müşteri mağazayı arar; mağaza buradan yeni şifre üretip telefonda söyler.
// Şifre yalnız bu yanıtta görünür, saklanmaz. Tüm sorgular tenant_id ile sınırlı.

export async function GET() {
  const guard = await ensureTenantAdminResponse();
  if (guard) return guard;
  const tenant = (await getSessionContext()).tenant!;
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ members: [] });

  const { data } = await supabase
    .from("store_members")
    .select("id, phone, full_name, email, created_at, last_login_at")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false })
    .limit(1000);
  return NextResponse.json({ members: data ?? [] });
}

export async function PATCH(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) return guard;
  const tenant = (await getSessionContext()).tenant!;
  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : null;
  if (!id) return NextResponse.json({ error: "Üye seçilmedi." }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });

  // Telefonda kolay söylenen 6 haneli şifre; müşteri girişten sonra değiştirebilir.
  const password = String(randomInt(100000, 1000000));
  const { data, error } = await supabase
    .from("store_members")
    .update({ password_hash: hashMemberPassword(password), updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", tenant.id)
    .select("id")
    .maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Şifre yenilenemedi." }, { status: 404 });
  return NextResponse.json({ password });
}
