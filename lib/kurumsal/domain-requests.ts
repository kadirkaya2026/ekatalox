import nodemailer from "nodemailer";
import { appEnv } from "@/lib/env";
import { getPlanLabel } from "@/lib/billing/plans";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Tenant } from "@/lib/types";

// Alan adı talepleri (domain_requests, bkz. 0135). Tenant "Yeni alan adı
// seç"te boşta bir alan adı seçer; satın alma + bağlama ekipçe yapılır.
// Tablo henüz yoksa okuma null/[] döner, yazma hata mesajıyla döner (kod
// migration'a tolerant).

export const DOMAIN_REQUEST_STATUSES = ["new", "purchased", "cancelled"] as const;
export type DomainRequestStatus = (typeof DOMAIN_REQUEST_STATUSES)[number];

export const DOMAIN_REQUEST_STATUS_LABELS: Record<DomainRequestStatus, string> = {
  new: "Bekliyor",
  purchased: "Satın alındı",
  cancelled: "İptal",
};

export interface DomainRequest {
  id: string;
  tenant_id: string;
  domain: string;
  price_usd: number | null;
  period_years: number | null;
  status: DomainRequestStatus;
  note: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface AdminDomainRequest extends DomainRequest {
  tenant: { company_name: string; subdomain: string; plan: string } | null;
}

const SELECT = "id, tenant_id, domain, price_usd, period_years, status, note, created_at, updated_at";

function toRequest(row: Record<string, unknown>): DomainRequest {
  return {
    ...(row as unknown as DomainRequest),
    price_usd: row.price_usd === null || row.price_usd === undefined ? null : Number(row.price_usd),
  };
}

/** Tenant'ın bekleyen (new) talebi; yoksa null. */
export async function getPendingDomainRequest(tenantId: string): Promise<DomainRequest | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("domain_requests")
    .select(SELECT)
    .eq("tenant_id", tenantId)
    .eq("status", "new")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return toRequest(data as Record<string, unknown>);
}

export async function createDomainRequest(params: {
  tenantId: string;
  domain: string;
  priceUsd: number | null;
  periodYears: number | null;
  note?: string | null;
}): Promise<{ ok: true; request: DomainRequest } | { ok: false; error: string }> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "Sunucu yapılandırması eksik." };
  const { data, error } = await supabase
    .from("domain_requests")
    .insert({
      tenant_id: params.tenantId,
      domain: params.domain,
      price_usd: params.priceUsd,
      period_years: params.periodYears,
      note: params.note ?? null,
    })
    .select(SELECT)
    .single();
  if (error || !data) {
    console.error("[domain-requests] kaydedilemedi:", error?.message);
    return { ok: false, error: "Talep kaydedilemedi. Lütfen tekrar deneyin." };
  }
  return { ok: true, request: toRequest(data as Record<string, unknown>) };
}

/** Tenant kendi bekleyen talebini iptal eder (yalnız status=new). */
export async function cancelDomainRequest(tenantId: string, requestId: string): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return false;
  const { data, error } = await supabase
    .from("domain_requests")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("tenant_id", tenantId)
    .eq("id", requestId)
    .eq("status", "new")
    .select("id")
    .maybeSingle();
  return !error && Boolean(data);
}

/** Süper admin listesi: en yeni en üstte, tenant adıyla. */
export async function listDomainRequestsForAdmin(limit = 200): Promise<AdminDomainRequest[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("domain_requests")
    .select(`${SELECT}, tenants(company_name, subdomain, plan)`)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) {
    if (error) console.error("[domain-requests] liste okunamadı:", error.message);
    return [];
  }
  return (data as Array<Record<string, unknown>>).map((row) => {
    const { tenants, ...rest } = row;
    const tenant = (Array.isArray(tenants) ? tenants[0] : tenants) as AdminDomainRequest["tenant"];
    return { ...toRequest(rest), tenant: tenant ?? null };
  });
}

export async function updateDomainRequestStatus(requestId: string, status: DomainRequestStatus): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return false;
  const { data, error } = await supabase
    .from("domain_requests")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", requestId)
    .select("id")
    .maybeSingle();
  return !error && Boolean(data);
}

/* ───────────── Ekibe e-posta ───────────── */

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function buildAdminTenantUrl(tenantId: string) {
  return `https://${appEnv.adminDomain}/tenants/${tenantId}`;
}

/**
 * "[eKatalox] Alan adı talebi: {domain} — {firma}" e-postası (iletişim
 * formuyla aynı SMTP ayarları). SMTP env yoksa loglar, talep yine kaydedilir.
 */
export async function sendDomainRequestEmail(params: {
  tenant: Pick<Tenant, "id" | "company_name" | "subdomain" | "plan" | "contact_email" | "whatsapp_number">;
  contactPhone?: string | null;
  domain: string;
  available: boolean | null;
  priceUsd: number | null;
  periodYears: number | null;
  testMarker?: boolean;
}): Promise<{ sent: boolean; reason?: string }> {
  const { tenant, domain } = params;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn("[domain-requests] SMTP yapılandırması yok; e-posta gönderilmedi:", domain, tenant.subdomain);
    return { sent: false, reason: "smtp-yok" };
  }

  const availability =
    params.available === true
      ? `Boşta${params.priceUsd !== null ? ` · yıllık ~$${params.priceUsd}${params.periodYears && params.periodYears > 1 ? ` (${params.periodYears} yıl)` : ""}` : ""}`
      : params.available === false
        ? "Dolu görünüyordu (tenant yine de talep etti)"
        : "Kontrol edilemedi";
  const adminUrl = buildAdminTenantUrl(tenant.id);
  const rows: Array<[string, string]> = [
    ["Firma", tenant.company_name],
    ["Alt alan adı", `${tenant.subdomain}.${appEnv.rootDomain}`],
    ["Paket", getPlanLabel(tenant.plan ?? "baslangic")],
    ["E-posta", tenant.contact_email ?? "—"],
    ["Telefon", params.contactPhone ?? "—"],
    ["WhatsApp", tenant.whatsapp_number ?? "—"],
    ["İstenen alan adı", domain],
    ["Talep anındaki durum", availability],
  ];

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from: `"eKatalox Panel" <${process.env.SMTP_USER}>`,
      to: process.env.CONTACT_RECIPIENT ?? process.env.SMTP_USER,
      ...(tenant.contact_email ? { replyTo: tenant.contact_email } : {}),
      subject: `${params.testMarker ? "[TEST] " : ""}[eKatalox] Alan adı talebi: ${domain} — ${tenant.company_name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9f9f9;border-radius:8px;">
          <h2 style="color:#1a1a2e;margin-bottom:20px;">Yeni alan adı talebi</h2>
          <table style="width:100%;border-collapse:collapse;">
            ${rows
              .map(
                ([label, value]) =>
                  `<tr><td style="padding:8px 0;color:#555;width:160px;font-weight:bold;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:8px 0;color:#222;">${escapeHtml(value)}</td></tr>`,
              )
              .join("")}
          </table>
          <hr style="margin:20px 0;border:none;border-top:1px solid #ddd;" />
          <p style="color:#555;">Satın alıp bağladıktan sonra tenant'ın <b>kurumsal_domain</b> alanını doldurun ve talebi "Satın alındı" yapın:</p>
          <p><a href="${escapeHtml(adminUrl)}" style="display:inline-block;background:#059669;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:bold;">Süper admin → ${escapeHtml(tenant.company_name)}</a></p>
        </div>
      `,
    });
    return { sent: true };
  } catch (error) {
    console.error("[domain-requests] e-posta gönderilemedi:", error);
    return { sent: false, reason: "smtp-hata" };
  }
}
