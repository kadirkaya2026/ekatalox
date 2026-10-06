import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Panel ziyaret kaydı (0157): oturum çerezini okur, her istekte canlı çalışır.
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getSessionContext();

  // Yalnız tenant adminleri sayılır; süper admin ve oturumsuz istekler sessizce geçilir.
  if (!session.userId || session.profile?.role !== "tenant_admin" || !session.tenant) {
    return new NextResponse(null, { status: 204 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return new NextResponse(null, { status: 204 });
  }

  const body = (await request.json().catch(() => ({}))) as { path?: unknown; heartbeat?: unknown };
  const path = typeof body.path === "string" ? body.path : null;

  await supabase.rpc("record_panel_visit", {
    p_tenant_id: session.tenant.id,
    p_user_id: session.userId,
    p_path: path,
    p_user_agent: request.headers.get("user-agent"),
    p_is_page_view: body.heartbeat !== true,
  });

  return new NextResponse(null, { status: 204 });
}
