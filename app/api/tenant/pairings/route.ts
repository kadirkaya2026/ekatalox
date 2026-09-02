import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// "Yanında iyi gider" eşlemeleri: bayi kaynak kategoriye hedef kategorileri
// SIRALI seçer; priority = listedeki sıra. PUT kaynağın tamamını değiştirir.
const putSchema = z.object({
  source_category_id: z.string().uuid(),
  target_category_ids: z.array(z.string().uuid()).max(15),
});

async function guard() {
  const g = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (g) return { error: g } as const;
  const session = await getSessionContext();
  const tenant = session.tenant!;
  if (tenant.business_type !== "market") {
    return { error: NextResponse.json({ error: "Bu özellik sadece market tipi hesaplar için." }, { status: 403 }) } as const;
  }
  return { tenant } as const;
}

export async function GET() {
  const g = await guard();
  if ("error" in g) return g.error;
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ pairings: [] });
  const { data } = await supabase
    .from("category_pairings")
    .select("source_category_id, target_category_id, priority")
    .eq("tenant_id", g.tenant.id)
    .order("priority");
  return NextResponse.json({ pairings: data ?? [] });
}

export async function PUT(request: Request) {
  const g = await guard();
  if ("error" in g) return g.error;
  const body = await request.json().catch(() => null);
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  const { source_category_id, target_category_ids } = parsed.data;
  if (target_category_ids.includes(source_category_id)) {
    return NextResponse.json({ error: "Kategori kendisiyle eşlenemez." }, { status: 400 });
  }
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });

  // Kategorilerin bu tenant'a aitliği doğrulanır (başka bayinin id'si yazılamaz)
  const ids = [source_category_id, ...target_category_ids];
  const { data: owned } = await supabase.from("categories").select("id").eq("tenant_id", g.tenant.id).in("id", ids);
  if ((owned ?? []).length !== new Set(ids).size) {
    return NextResponse.json({ error: "Kategori bulunamadı." }, { status: 400 });
  }

  await supabase.from("category_pairings").delete().eq("tenant_id", g.tenant.id).eq("source_category_id", source_category_id);
  if (target_category_ids.length) {
    const { error } = await supabase.from("category_pairings").insert(
      target_category_ids.map((target, index) => ({
        tenant_id: g.tenant.id,
        source_category_id,
        target_category_id: target,
        priority: index + 1,
      })),
    );
    if (error) return NextResponse.json({ error: "Kaydedilemedi." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
