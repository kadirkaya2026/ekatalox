import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { revalidateStorefrontCache } from "@/lib/storefront/cache";
import {
  CUSTOMIZABLE_LEGAL_DOCS,
  getLegalProfileProblems,
  readLegalProfile,
  type TenantLegalProfile,
} from "@/lib/legal/tenant-legal";

// Ayarlar → Yasal Bilgiler (0178, 17 Eki 2026): satıcı bilgileri ve sözleşme
// metinleri. Online ödeme bunlar eksiksizken açılabilir (bkz. tenant-legal.ts).
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();

const bodySchema = z
  .object({
    profile: z
      .object({
        entity_type: z.enum(["sahis", "sirket"]).nullable().optional(),
        legal_name: optionalText(200),
        tax_office: optionalText(80),
        tax_number: optionalText(20),
        mersis_no: optionalText(30),
        trade_registry_no: optionalText(40),
        address: optionalText(400),
        district: optionalText(60),
        city: optionalText(60),
        phone: optionalText(30),
        email: optionalText(120),
        kep_address: optionalText(120),
        delivery_days: z.number().int().min(1).max(30).nullable().optional(),
        shipping_note: optionalText(600),
        return_note: optionalText(1500),
        /** "Bilgilerin doğru olduğunu onaylıyorum" kutusu. */
        confirmed: z.boolean().optional(),
      })
      .strict()
      .optional(),
    documents: z
      .record(z.string(), z.object({ custom: z.string().max(30000).nullable() }))
      .optional(),
  })
  .strict();

export async function PATCH(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) return guard;

  const session = await getSessionContext();
  const tenant = session.tenant!;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Yasal bilgiler geçersiz." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase production yapılandırması eksik." }, { status: 500 });
  }

  const { data: current } = await supabase
    .from("tenant_storefront_settings")
    .select("legal_profile")
    .eq("tenant_id", tenant.id)
    .maybeSingle();
  const previous = readLegalProfile((current as { legal_profile?: unknown } | null)?.legal_profile);
  let next: TenantLegalProfile = { ...previous };

  if (parsed.data.profile) {
    const { confirmed, ...fields } = parsed.data.profile;
    const cleaned = Object.fromEntries(
      Object.entries(fields).map(([key, value]) => [key, typeof value === "string" ? value || null : value]),
    ) as TenantLegalProfile;
    next = { ...next, ...cleaned };
    // Onay kutusu işaretli gelmezse onay düşer; işaretliyse bilgiler eksiksiz olmalı.
    if (confirmed) {
      const problems = getLegalProfileProblems({ ...next, confirmed_at: "onay" });
      if (problems.length) {
        return NextResponse.json(
          { error: `Eksik ya da hatalı alanlar: ${problems.join(", ")}.`, problems },
          { status: 400 },
        );
      }
      next.confirmed_at = new Date().toISOString();
    } else {
      next.confirmed_at = null;
    }
  }

  if (parsed.data.documents) {
    const documents = { ...(next.documents ?? {}) };
    for (const [slug, value] of Object.entries(parsed.data.documents)) {
      if (!(CUSTOMIZABLE_LEGAL_DOCS as string[]).includes(slug)) continue;
      documents[slug as keyof typeof documents] = { custom: value.custom?.trim() || null };
    }
    next.documents = documents;
  }

  const { data, error } = await supabase
    .from("tenant_storefront_settings")
    .update({ legal_profile: next })
    .eq("tenant_id", tenant.id)
    .select("legal_profile")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Yasal bilgiler kaydedilemedi." }, { status: 400 });
  }

  revalidateStorefrontCache({ tenantId: tenant.id, subdomain: tenant.subdomain });

  const saved = readLegalProfile((data as { legal_profile?: unknown }).legal_profile);
  return NextResponse.json({ profile: saved, problems: getLegalProfileProblems(saved) });
}
