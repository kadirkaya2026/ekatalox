import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureSuperAdminResponse } from "@/lib/tenancy/guards";

// Ziyaretçi Hikâyeleri: "Bu benim" / "Ben değilim" (site_visitors.note).
const schema = z.object({ visitorId: z.string().uuid(), note: z.string().trim().max(120).nullable() });

export async function POST(request: Request) {
  const guard = await ensureSuperAdminResponse();
  if (guard) return guard;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Veritabanına ulaşılamıyor." }, { status: 503 });

  const { error } = await supabase
    .from("site_visitors")
    .update({ note: parsed.data.note || null })
    .eq("id", parsed.data.visitorId);
  if (error) return NextResponse.json({ error: "Kaydedilemedi." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
