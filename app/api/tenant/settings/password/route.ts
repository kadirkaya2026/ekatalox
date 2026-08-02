import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { shouldAllowDemoFallback } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";

export async function PATCH() {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
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

  const { error } = await supabase
    .from("profiles")
    .update({ must_change_password: false })
    .eq("id", session.userId!);

  if (error) {
    return NextResponse.json({ error: "Şifre durumu güncellenemedi." }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}