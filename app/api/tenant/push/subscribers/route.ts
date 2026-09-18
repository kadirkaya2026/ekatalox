import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface PushSubscriberRow {
  id: string;
  name: string | null;
  phone: string | null;
  access_code: string | null;
  price_list_id: string | null;
  price_list_name: string | null;
  created_at: string;
  last_used_at: string | null;
}

// Bildirim açan müşteriler (panel listesi): ad, telefon, hangi şifreyle
// girdiği ve o şifrenin fiyat listesi — bayi ucuz listenin kampanyasını
// yanlış kişiye atmasın diye liste adı satırda görünür.
export async function GET() {
  const guard = await ensureTenantAdminResponse();
  if (guard) return guard;
  const session = await getSessionContext();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ subscribers: [] });

  const { data } = await supabase
    .from("push_subscriptions")
    .select(
      "id, subscriber_name, subscriber_phone, price_list_id, created_at, last_used_at, access_code:access_codes(password_code), price_list:price_lists(name)",
    )
    .eq("tenant_id", session.tenant!.id)
    .eq("kind", "campaign")
    .order("created_at", { ascending: false })
    .limit(1000);

  type Row = {
    id: string;
    subscriber_name: string | null;
    subscriber_phone: string | null;
    price_list_id: string | null;
    created_at: string;
    last_used_at: string | null;
    access_code: { password_code: string } | { password_code: string }[] | null;
    price_list: { name: string } | { name: string }[] | null;
  };
  const one = <T,>(v: T | T[] | null) => (Array.isArray(v) ? v[0] ?? null : v);
  const subscribers: PushSubscriberRow[] = ((data ?? []) as Row[]).map((row) => ({
    id: row.id,
    name: row.subscriber_name,
    phone: row.subscriber_phone,
    access_code: one(row.access_code)?.password_code ?? null,
    price_list_id: row.price_list_id,
    price_list_name: one(row.price_list)?.name ?? null,
    created_at: row.created_at,
    last_used_at: row.last_used_at,
  }));
  return NextResponse.json({ subscribers }, { headers: { "Cache-Control": "no-store" } });
}
