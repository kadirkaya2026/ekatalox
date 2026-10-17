import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { findAttemptByReference } from "@/lib/payments/order-payments";
import { settlePaynetAttempt } from "@/lib/payments/settle";

// Paynet confirmation_url (0185): yalnız başarılı ödemede ve İMZASIZ gelir.
// Gövdeye güvenilmez; sonuç Paynet işlem detayından sorulur.
export async function POST(request: Request) {
  const reference = new URL(request.url).searchParams.get("ref") ?? "";
  const supabase = createSupabaseAdminClient();
  const attempt = supabase && reference ? await findAttemptByReference(supabase, reference) : null;
  if (!supabase || !attempt || attempt.provider !== "paynet") {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  try {
    const status = await settlePaynetAttempt(supabase, attempt);
    return NextResponse.json({ ok: true, status });
  } catch (error) {
    console.error("[paynet-confirm] sonuç alınamadı", { reference, error: String(error) });
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
