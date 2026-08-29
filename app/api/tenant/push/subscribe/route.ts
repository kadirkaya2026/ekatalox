import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Bayi cihazını yeni sipariş bildirimlerine abone eder. tenant_id istemciden
// değil oturumdan gelir; aynı hesaba giren her cihaz ayrı kayıt.
export async function POST(request: Request) {
  const guard = await ensureTenantAdminResponse();
  if (guard) return guard;
  const session = await getSessionContext();
  const tenant = session.tenant!;
  if (tenant.is_demo) return NextResponse.json({ error: "Demo hesapta bildirim kapalı." }, { status: 403 });

  const body = await request.json().catch(() => null);
  const sub = body?.subscription;
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return NextResponse.json({ error: "Geçersiz abonelik." }, { status: 400 });
  }
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });

  const { error } = await supabase.from("dealer_push_subscriptions").upsert(
    {
      tenant_id: tenant.id,
      profile_id: session.profile?.id ?? null,
      endpoint: String(sub.endpoint),
      p256dh: String(sub.keys.p256dh),
      auth: String(sub.keys.auth),
      user_agent: typeof body.user_agent === "string" ? body.user_agent.slice(0, 300) : null,
      failure_count: 0,
    },
    { onConflict: "endpoint" },
  );
  if (error) return NextResponse.json({ error: "Abonelik kaydedilemedi." }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  const guard = await ensureTenantAdminResponse();
  if (guard) return guard;
  const session = await getSessionContext();
  const body = await request.json().catch(() => null);
  const endpoint = typeof body?.endpoint === "string" ? body.endpoint : "";
  const supabase = createSupabaseAdminClient();
  if (!endpoint || !supabase) return NextResponse.json({ ok: true });
  await supabase.from("dealer_push_subscriptions").delete().eq("endpoint", endpoint).eq("tenant_id", session.tenant!.id);
  return NextResponse.json({ ok: true });
}
