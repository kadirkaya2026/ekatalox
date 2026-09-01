import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Veresiye işaretleme (bkz. 0107): mark = veresiye verildi, paid = tahsil
// edildi (geçmiş korunur), unmark = yanlışlıkla işaretlendi, tamamen kalksın.
const schema = z.object({ action: z.enum(["mark", "unmark", "paid"]) });

export async function POST(request: Request, ctx: { params: Promise<{ orderId: string }> }) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) return guard;

  const session = await getSessionContext();
  const tenant = session.tenant!;
  if (tenant.business_type !== "market") {
    return NextResponse.json({ error: "Bu özellik sadece market tipi hesaplar için kullanılabilir." }, { status: 403 });
  }

  const { orderId } = await ctx.params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  let query = supabase
    .from("orders")
    .update(
      parsed.data.action === "mark"
        ? { credit_marked_at: new Date().toISOString(), credit_paid_at: null }
        : parsed.data.action === "paid"
          ? { credit_paid_at: new Date().toISOString() }
          : { credit_marked_at: null, credit_paid_at: null },
    )
    .eq("tenant_id", tenant.id)
    .eq("id", orderId);

  // İptal edilmiş sipariş veresiye yapılamaz; "tahsil edildi" yalnız açık
  // veresiyede anlamlı.
  if (parsed.data.action === "mark") query = query.neq("status", "cancelled");
  if (parsed.data.action === "paid") {
    query = query.not("credit_marked_at", "is", null).is("credit_paid_at", null);
  }

  const { data, error } = await query.select("*").maybeSingle();

  if (error) {
    console.error("[orders] veresiye güncellenemedi:", error);
    return NextResponse.json({ error: "Veresiye durumu güncellenemedi." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json(
      { error: "Sipariş bulunamadı veya bu işlem için uygun durumda değil." },
      { status: 404 },
    );
  }

  return NextResponse.json({ order: data });
}
