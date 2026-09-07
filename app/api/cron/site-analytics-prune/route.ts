// Ham ziyaretçi olaylarını 180 günden sonra siler (oturum/ziyaretçi özetleri
// kalır). vercel.json'daki günlük cron çağırır; cleanup-order-receipts ile
// aynı CRON_SECRET kalıbı.
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const KEEP_DAYS = 180;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  const { data, error } = await supabase.rpc("site_analytics_prune", { p_keep_days: KEEP_DAYS });

  if (error) {
    console.error("[cron/site-analytics-prune] hata:", error.message);
    return NextResponse.json({ error: "Temizlik başarısız." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, deleted: Number(data ?? 0), keepDays: KEEP_DAYS });
}
