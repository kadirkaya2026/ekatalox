import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getTenantStorefrontSettings } from "@/lib/data";
import { buildCampaignRuleSentence } from "@/lib/validators/campaign";
import { getTenantStorefrontOrigin, sendTenantBroadcastPush } from "@/lib/push/send-tenant-broadcast-push";

// Kampanya kartını abone müşterilere bildirim olarak gönder. Bayi istediği
// kadar tekrar gönderebilir; aynı tag cihazda öncekinin yerine geçer.
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await ensureTenantAdminResponse();
  if (guard) return guard;
  const session = await getSessionContext();
  const tenant = session.tenant!;
  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim().slice(0, 200) : "";
  const priceListId = typeof body?.price_list_id === "string" && body.price_list_id ? body.price_list_id : null;

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  const { data: campaign } = await supabase
    .from("tenant_campaigns")
    .select("id, title, description, is_active, rule_type, min_cart_amount, discount_kind, discount_value, payment_method")
    .eq("tenant_id", tenant.id)
    .eq("id", id)
    .maybeSingle();
  if (!campaign) return NextResponse.json({ error: "Kampanya bulunamadı." }, { status: 404 });
  if (!campaign.is_active) return NextResponse.json({ error: "Pasif kampanya için bildirim gönderilmez." }, { status: 400 });

  const settings = await getTenantStorefrontSettings(tenant.id).catch(() => null);
  const rule =
    campaign.rule_type === "cart_threshold" && campaign.min_cart_amount !== null
      ? buildCampaignRuleSentence({
          minCartAmount: Number(campaign.min_cart_amount),
          discountKind: campaign.discount_kind,
          discountValue: campaign.discount_value === null ? null : Number(campaign.discount_value),
          paymentMethod: campaign.payment_method,
          formatAmount: (value) => `${Number(value).toLocaleString("tr-TR")} ₺`,
          labels: {
            template: (threshold, benefit) => `${threshold} ve üzeri alışverişte ${benefit} indirim`,
            cashOnly: "(nakit ödemede)",
            cardOnly: "(kart ile ödemede)",
          },
        })
      : null;

  const sent = await sendTenantBroadcastPush({
    tenantId: tenant.id,
    title: campaign.title,
    body: message || campaign.description || rule || "Kampanyalar bölümünden inceleyin.",
    origin: getTenantStorefrontOrigin(tenant),
    target: { type: "campaigns" },
    iconUrl: settings?.logo_url || settings?.site_favicon_url || null,
    tag: `campaign-${campaign.id}`,
    priceListId,
  });
  return NextResponse.json({ ok: true, sent });
}
