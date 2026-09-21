// Kurulum sihirbazı: "Şimdi değil" / "Bitir" → tenants.onboarding_dismissed_at
// damgalanır, Genel Bakış'ta sihirbaz bir daha kendiliğinden açılmaz.
// Migration 0126 uygulanmadan kolon yoksa hata döner; istemci ayrıca
// localStorage'a da yazdığı için kullanıcı yine de tekrar tekrar görmez.
import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";

export async function POST(request: Request) {
  const guard = await ensureTenantAdminResponse();
  if (guard) return guard;

  const session = await getSessionContext();
  const body = (await request.json().catch(() => ({}))) as { action?: string };
  const action = body.action === "reopen" ? "reopen" : "dismiss";

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: true, persisted: false });
  }

  const { error } = await supabase
    .from("tenants")
    .update({ onboarding_dismissed_at: action === "dismiss" ? new Date().toISOString() : null })
    .eq("id", session.tenant!.id);

  if (error) {
    console.error("[onboarding] durum yazılamadı:", error.message);
    return NextResponse.json({ ok: false, error: "Kurulum durumu kaydedilemedi." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, persisted: true });
}
