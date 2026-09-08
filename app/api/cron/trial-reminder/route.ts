// Deneme bitimine 5 gün kala hatırlatma (günlük). CRON_SECRET kalıbı.
import { NextResponse } from "next/server";
import { getEsnafPlanByPlanId, getPlanPrice } from "@/lib/billing/esnaf-plans";
import { sendEmail } from "@/lib/email/send";
import { buildTrialEndingEmail } from "@/lib/email/templates/trial-ending";
import { appEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });

  const from = new Date(Date.now() + 4 * 86_400_000).toISOString();
  const to = new Date(Date.now() + 6 * 86_400_000).toISOString();
  const { data: tenants, error } = await supabase
    .from("tenants")
    .select("id, company_name, contact_email, contact_full_name, trial_ends_at, plan, billing_period, coupon_code")
    .gte("trial_ends_at", from)
    .lte("trial_ends_at", to)
    .is("trial_reminder_sent_at", null)
    .not("contact_email", "is", null)
    .limit(200);
  if (error) return NextResponse.json({ error: "Sorgu başarısız." }, { status: 500 });

  let sent = 0;
  for (const t of tenants ?? []) {
    const plan = getEsnafPlanByPlanId(t.plan);
    if (!plan || !t.contact_email || !t.trial_ends_at) continue;
    const period = t.billing_period === "monthly" ? "monthly" : "yearly";
    const mail = buildTrialEndingEmail({
      businessName: t.company_name,
      contactName: t.contact_full_name ?? null,
      trialEndsAt: t.trial_ends_at,
      planName: plan.name,
      billingPeriod: period,
      price: getPlanPrice(plan, period),
      couponCode: t.coupon_code ?? null,
      panelUrl: `https://${appEnv.appDomain}/`,
    });
    const ok = await sendEmail({ to: t.contact_email, ...mail });
    if (ok) {
      await supabase.from("tenants").update({ trial_reminder_sent_at: new Date().toISOString() }).eq("id", t.id);
      sent += 1;
    }
  }
  return NextResponse.json({ ok: true, sent, candidates: tenants?.length ?? 0 });
}
