import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionContext } from "@/lib/auth/session";
import { revalidateStorefrontCache } from "@/lib/storefront/cache";
import { MAX_FAQ_ITEMS, readHelpPages } from "@/lib/storefront/help-pages";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";

// Ayarlar → Yardım Sayfaları (0184): market vitrininde Hesabım > Yardım'daki
// Hakkımızda, Sıkça Sorulan Sorular ve müşteri hizmetleri notu.
const bodySchema = z.object({
  about: z.string().max(20000),
  support_note: z.string().max(2000),
  faq: z
    .array(z.object({ q: z.string().trim().max(300), a: z.string().trim().max(4000) }))
    .max(MAX_FAQ_ITEMS, `En fazla ${MAX_FAQ_ITEMS} soru eklenebilir.`),
});

export async function PATCH(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) return guard;
  const tenant = (await getSessionContext()).tenant!;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Yardım sayfaları geçersiz." }, { status: 400 });
  }
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });

  const helpPages = readHelpPages(parsed.data);
  const { error } = await supabase
    .from("tenant_storefront_settings")
    .update({ help_pages: helpPages, updated_at: new Date().toISOString() })
    .eq("tenant_id", tenant.id);
  if (error) {
    console.error("[help-pages] kayıt hatası:", error);
    return NextResponse.json({ error: "Kaydedilemedi, tekrar deneyin." }, { status: 500 });
  }
  revalidateStorefrontCache({ tenantId: tenant.id, subdomain: tenant.subdomain });
  return NextResponse.json({ help_pages: helpPages });
}
