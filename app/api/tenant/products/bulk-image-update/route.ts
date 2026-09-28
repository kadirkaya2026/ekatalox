import { NextResponse } from "next/server";
import { revalidateStorefrontCache } from "@/lib/storefront/cache";
import { z } from "zod";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const bulkImageUpdateSchema = z.array(
  z.object({
    sku_code: z.string().min(1),
    image_url: z.string().url(),
    // 1: ana görsel, 2/3: ek görseller ("KOD (2).jpg"). 28 Eyl 2026.
    slot: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  }),
);

export async function POST(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const tenant = session.tenant!;
  const body = await request.json();
  const parsed = bulkImageUpdateSchema.safeParse(body.updates ?? []);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Geçersiz veri formatı." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ count: parsed.data.length, skipped: true });
  }

  let successCount = 0;
  const failedSkus: string[] = [];

  for (const update of parsed.data) {
    const { data, error } = await supabase
      .from("products")
      .update(
        update.slot === 2
          ? { image_url_2: update.image_url }
          : update.slot === 3
            ? { image_url_3: update.image_url }
            : { image_url: update.image_url },
      )
      .eq("tenant_id", tenant.id)
      .eq("sku_code", update.sku_code)
      .select("id");

    if (error || !data?.length) {
      failedSkus.push(update.sku_code);
    } else {
      successCount++;
    }
  }

  // Vitrin onbellegini tazele — degisiklik musteriye aninda yansisin.
  revalidateStorefrontCache({ tenantId: tenant.id, subdomain: tenant.subdomain });

  return NextResponse.json({ count: successCount, failedSkus });
}
