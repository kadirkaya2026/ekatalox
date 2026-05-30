import { NextResponse } from "next/server";
import { deleteExpiredOrderReceipts } from "@/lib/storage/order-receipts";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Sunucu yapılandırması eksik." },
      { status: 500 },
    );
  }

  try {
    const result = await deleteExpiredOrderReceipts(supabase);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[cron/cleanup-order-receipts] hata:", error);
    return NextResponse.json({ error: "Temizlik başarısız." }, { status: 500 });
  }
}
