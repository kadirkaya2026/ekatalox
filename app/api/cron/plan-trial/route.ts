// Ücretli paket denemesi (0132) — saatlik. CRON_SECRET kalıbı.
//  1) Bitişe PAID_PLAN_TRIAL_REMINDER_DAYS gün kala müşteriye bir kez hatırlatma.
//  2) Süresi dolan mağazayı KAPATMADAN Ücretsiz plana düşür; müşteriye ve
//     satışa bilgi ver. Güncelleme koşullu: süper admin bu arada "Ödeme alındı"
//     dediyse (plan_trial_ends_at null) satır eşleşmez, paket korunur.
import { NextResponse } from "next/server";
import { PAID_PLAN_TRIAL_REMINDER_DAYS } from "@/lib/billing/plan-trial";
import { getLimitForPlan } from "@/lib/billing/plans";
import { getToptanPlan } from "@/lib/billing/toptan-plans";
import { sendEmail } from "@/lib/email/send";
import { escapeHtml } from "@/lib/email/layout";
import { buildPlanTrialEndedEmail, buildPlanTrialReminderEmail } from "@/lib/email/templates/plan-trial";
import { getSalesRecipient } from "@/lib/email/transport";
import { appEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type TrialTenant = {
  id: string;
  company_name: string;
  subdomain: string;
  plan: string;
  contact_email: string | null;
  contact_full_name: string | null;
  plan_trial_ends_at: string;
};

const COLUMNS = "id, company_name, subdomain, plan, contact_email, contact_full_name, plan_trial_ends_at";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });

  const now = new Date();
  const nowIso = now.toISOString();
  const panelUrl = `https://${appEnv.appDomain}/`;

  // 1) Hatırlatma
  const reminderUntil = new Date(now.getTime() + PAID_PLAN_TRIAL_REMINDER_DAYS * 86_400_000).toISOString();
  const { data: remindList, error: remindError } = await supabase
    .from("tenants")
    .select(COLUMNS)
    .gt("plan_trial_ends_at", nowIso)
    .lte("plan_trial_ends_at", reminderUntil)
    .is("plan_trial_reminder_sent_at", null)
    .not("contact_email", "is", null)
    .limit(200);
  if (remindError) return NextResponse.json({ error: "Hatırlatma sorgusu başarısız." }, { status: 500 });

  let reminded = 0;
  for (const t of (remindList ?? []) as TrialTenant[]) {
    const planName = getToptanPlan(t.plan)?.name ?? t.plan;
    const mail = buildPlanTrialReminderEmail({
      businessName: t.company_name,
      contactName: t.contact_full_name,
      planName,
      trialEndsAt: t.plan_trial_ends_at,
      panelUrl,
    });
    if (t.contact_email && (await sendEmail({ to: t.contact_email, ...mail }))) {
      await supabase.from("tenants").update({ plan_trial_reminder_sent_at: nowIso }).eq("id", t.id);
      reminded += 1;
    }
  }

  // 2) Süresi dolanları Ücretsiz plana düşür
  const { data: expiredList, error: expiredError } = await supabase
    .from("tenants")
    .select(COLUMNS)
    .lte("plan_trial_ends_at", nowIso)
    .limit(200);
  if (expiredError) return NextResponse.json({ error: "Bitiş sorgusu başarısız." }, { status: 500 });

  let downgraded = 0;
  for (const t of (expiredList ?? []) as TrialTenant[]) {
    const { data: updated, error } = await supabase
      .from("tenants")
      .update({
        plan: "free",
        max_product_limit: getLimitForPlan("free"),
        plan_trial_ends_at: null,
        plan_trial_reminder_sent_at: null,
      })
      .eq("id", t.id)
      .lte("plan_trial_ends_at", nowIso)
      .select("id");
    if (error) {
      console.error("[plan-trial] düşürülemedi:", t.subdomain, error.message);
      continue;
    }
    if (!updated?.length) continue;
    downgraded += 1;

    const planName = getToptanPlan(t.plan)?.name ?? t.plan;
    const mail = buildPlanTrialEndedEmail({
      businessName: t.company_name,
      contactName: t.contact_full_name,
      planName,
      trialEndsAt: t.plan_trial_ends_at,
      panelUrl,
    });
    await Promise.all([
      t.contact_email ? sendEmail({ to: t.contact_email, ...mail }) : Promise.resolve(false),
      sendEmail({
        to: getSalesRecipient(),
        fromName: "eKatalox Kayıt",
        subject: `[Deneme bitti] ${t.company_name} — ${planName} → Ücretsiz`,
        html: `<p><strong>${escapeHtml(t.company_name)}</strong> (${escapeHtml(t.subdomain)}.ekatalox.com) ${escapeHtml(planName)} denemesi ödeme alınmadan bitti; mağaza Ücretsiz plana düşürüldü.</p><p><a href="https://admin.ekatalox.com/tenants/${t.id}">Admin panelinde aç</a></p>`,
        text: `${t.company_name} (${t.subdomain}.ekatalox.com) ${planName} denemesi bitti, Ücretsiz plana düşürüldü. https://admin.ekatalox.com/tenants/${t.id}`,
      }),
    ]);
  }

  return NextResponse.json({ ok: true, reminded, downgraded });
}
