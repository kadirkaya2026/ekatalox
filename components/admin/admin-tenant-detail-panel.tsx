"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  Boxes,
  CalendarClock,
  Check,
  ClipboardList,
  ExternalLink,
  Eye,
  KeyRound,
  MonitorSmartphone,
  Package,
  Pencil,
  Settings2,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { SettingsTabs } from "@/components/dashboard/settings-tabs";
import {
  formatEffectiveProductLimit,
  formatProductLimit,
  formatVisitorLimit,
  getPlanLabel,
  PLAN_OPTIONS,
  TOPTAN_PLAN_OPTIONS,
} from "@/lib/billing/plans";
import { getPlanTrialDaysLeft } from "@/lib/billing/plan-trial";
import { getPriceListDisplayName, normalizePriceListName } from "@/lib/price-lists/constants";
import { SECTOR_THEME_MAP } from "@/lib/storefront/esnaf-themes";
import type { AccessCode, TenantPlan, TenantWithRelations } from "@/lib/types";
import { cn, formatDate, formatTimeAgo } from "@/lib/utils";

function getTrialBadge(trialEndsAt: string | null | undefined) {
  if (!trialEndsAt) {
    return null;
  }

  const diffMs = new Date(trialEndsAt).getTime() - Date.now();
  const daysLeft = Math.ceil(diffMs / (24 * 60 * 60 * 1000));

  if (daysLeft <= 0) {
    return { label: "Deneme süresi doldu", className: "bg-rose-50 text-rose-700" };
  }

  return {
    label: `Deneme — ${daysLeft} gün kaldı`,
    className: "bg-amber-50 text-amber-700",
  };
}

function SignupInfoField({
  label,
  value,
  mono = false,
  className,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className={cn("mt-0.5 text-slate-900", mono && "font-mono text-xs", !value && "text-slate-400")}>
        {value?.trim() ? value : "—"}
      </dd>
    </div>
  );
}

const BILLING_PERIOD_LABELS: Record<string, string> = { monthly: "Aylık", yearly: "Yıllık" };

// Paket rozeti renkleri tenant listesiyle aynı (admin-tenants-manager).
const PLAN_BADGE_CLASS: Record<string, string> = {
  free: "bg-slate-200 text-slate-700",
  starter: "bg-sky-600 text-white",
  professional: "bg-violet-600 text-white",
  corporate: "bg-amber-500 text-white",
};

type DetailTab = "plan" | "access" | "signup" | "visits" | "reports" | "customers" | "advanced";

/** Sunucu sayfasının hazır verdiği bölümler; sekmelerde gösterilir. */
export interface AdminTenantDetailSlots {
  visits?: ReactNode;
  reports?: ReactNode;
  customers?: ReactNode;
}

function SectionCard({
  title,
  description,
  children,
  className,
  tone = "default",
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  tone?: "default" | "warning" | "danger";
}) {
  return (
    <Card
      className={cn(
        "p-5",
        tone === "warning" && "border-amber-200 bg-amber-50/40",
        tone === "danger" && "border-rose-200",
        className,
      )}
    >
      <p className={cn("text-sm font-semibold", tone === "danger" ? "text-rose-700" : "text-slate-900")}>{title}</p>
      {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </Card>
  );
}

function StatBox({
  icon: Icon,
  label,
  value,
  hint,
  tone = "slate",
}: {
  icon: typeof Package;
  label: string;
  value: string;
  hint?: string | null;
  tone?: "slate" | "emerald" | "amber" | "rose";
}) {
  const tones = {
    slate: "bg-slate-100 text-slate-600",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
  };
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5">
      <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", tones[tone])}>
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="truncate text-sm font-semibold tabular-nums text-slate-900">{value}</p>
        {hint ? <p className="truncate text-xs text-slate-500">{hint}</p> : null}
      </div>
    </div>
  );
}

export function AdminTenantDetailPanel({
  tenant: initialTenant,
  slots = {},
}: {
  tenant: TenantWithRelations;
  slots?: AdminTenantDetailSlots;
}) {
  const [activeTab, setActiveTab] = useState<DetailTab>("plan");
  const router = useRouter();
  // Kayıttan sonra tenant listesi eski halini göstermesin (staleTimes.dynamic 30 sn
  // istemci önbelleği): tenant her değiştiğinde sunucu verisi tazelenir.
  const [tenant, setTenant] = useState(initialTenant);
  const loadedTenant = useRef(tenant);
  useEffect(() => {
    if (tenant !== loadedTenant.current) router.refresh();
  }, [tenant, router]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [companyNameDraft, setCompanyNameDraft] = useState(tenant.company_name);
  const [planDraft, setPlanDraft] = useState<TenantPlan>(tenant.plan ?? "baslangic");
  const [visitorAddonDraft, setVisitorAddonDraft] = useState(tenant.visitor_limit_addon ?? 0);
  const [productAddonDraft, setProductAddonDraft] = useState(tenant.product_limit_addon ?? 0);
  const [planCouponDraft, setPlanCouponDraft] = useState("");
  const [customDomainDraft, setCustomDomainDraft] = useState(tenant.custom_domain ?? "");
  const [giftMonths, setGiftMonths] = useState(1);
  const [paidNoteDraft, setPaidNoteDraft] = useState("");
  const [codeDraft, setCodeDraft] = useState("");
  const [priceListDraft, setPriceListDraft] = useState(tenant.price_lists?.[0]?.id ?? "");
  const [editingAccessCodeId, setEditingAccessCodeId] = useState<string | null>(null);
  const [editDrafts, setEditDrafts] = useState<
    Record<string, { password_code: string; price_list_id: string }>
  >({});
  const [message, setMessage] = useState<string | null>(null);
  // Deneme diyalogları: "Denemeye al" paket + gün sorar; "Denemeyi sonlandır" ödeme alındı mı / hangi paket sorar.
  const [trialDialog, setTrialDialog] = useState<"start" | "end" | null>(null);
  const [trialPlanDraft, setTrialPlanDraft] = useState<TenantPlan>("corporate");
  const [trialDaysDraft, setTrialDaysDraft] = useState(14);
  const [trialPaid, setTrialPaid] = useState(true);
  const [newPasswordDraft, setNewPasswordDraft] = useState("");
  const [newAdminEmailDraft, setNewAdminEmailDraft] = useState("");
  const [resetCredentials, setResetCredentials] = useState<{
    email: string;
    password: string;
    kind: "reset" | "create";
  } | null>(null);
  const [pending, startTransition] = useTransition();

  const sectorLabel = tenant.sector
    ? (SECTOR_THEME_MAP[tenant.sector]?.label ?? tenant.sector)
    : null;
  const billingPeriodLabel = tenant.billing_period
    ? (BILLING_PERIOD_LABELS[tenant.billing_period] ?? tenant.billing_period)
    : null;
  const billingAddress = tenant.billing_address ?? null;
  const cityDistrict = [billingAddress?.city, billingAddress?.district].filter(Boolean).join(" / ") || null;

  const hasPendingChanges = useMemo(
    () =>
      planDraft !== (tenant.plan ?? "baslangic") ||
      visitorAddonDraft !== (tenant.visitor_limit_addon ?? 0) ||
      productAddonDraft !== (tenant.product_limit_addon ?? 0),
    [planDraft, productAddonDraft, tenant, visitorAddonDraft],
  );

  function saveChanges() {
    setMessage(null);

    const planChanged = planDraft !== (tenant.plan ?? "baslangic");
    const body: Record<string, unknown> = {
      visitor_limit_addon: visitorAddonDraft,
      product_limit_addon: productAddonDraft,
    };

    // plan alanı yalnızca gerçekten değiştiyse gönderilir: API, plan alanı
    // her geldiğinde üyelik dönemini bugünden itibaren 12 aya sıfırlıyor.
    if (planChanged) {
      body.plan = planDraft;
      body.end_trial = true;
      if (planCouponDraft.trim()) body.coupon_code = planCouponDraft.trim();
    }

    startTransition(async () => {
      const response = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Değişiklikler kaydedilemedi.");
        return;
      }

      setTenant((current) => ({ ...current, ...result.tenant }));
      setPlanCouponDraft("");
      setMessage(
        result.coupon
          ? `Değişiklikler kaydedildi. ${result.coupon.message}`
          : "Değişiklikler kaydedildi.",
      );
    });
  }

  function saveCustomDomain(overrideValue?: string) {
    setMessage(null);
    const value = (overrideValue ?? customDomainDraft).trim();

    startTransition(async () => {
      const response = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ custom_domain: value || null }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Özel alan adı kaydedilemedi.");
        return;
      }

      setTenant((current) => ({ ...current, custom_domain: result.tenant.custom_domain }));
      setCustomDomainDraft(result.tenant.custom_domain ?? "");
      setMessage("Özel alan adı güncellendi.");
    });
  }

  function saveCompanyName() {
    const value = companyNameDraft.trim();

    if (!value) {
      setMessage("Firma adı boş olamaz.");
      return;
    }

    setMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_name: value }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Firma adı kaydedilemedi.");
        return;
      }

      setTenant((current) => ({ ...current, company_name: result.tenant.company_name }));
      setCompanyNameDraft(result.tenant.company_name);
      setIsEditingName(false);
      setMessage("Firma adı güncellendi.");
    });
  }

  function cancelEditingCompanyName() {
    setCompanyNameDraft(tenant.company_name);
    setIsEditingName(false);
  }

  // Demo Mağazalar sekmesi (0158): mağazayı müşteri listesi ile demo listesi arasında taşır.
  function setInternalDemo(value: boolean) {
    setMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_internal_demo: value }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Liste güncellenemedi.");
        return;
      }

      setTenant((current) => ({ ...current, ...result.tenant }));
      setMessage(value ? "Mağaza Demo Mağazalar listesine taşındı." : "Mağaza müşteri listesine taşındı.");
    });
  }

  // Paket ödemesi alındı işareti (0156): tenant listesinde rozet olarak görünür.
  function setPlanPaid(paid: boolean) {
    setMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          paid
            ? { mark_plan_paid: true, plan_paid_note: paidNoteDraft.trim() || undefined }
            : { unmark_plan_paid: true },
        ),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Ödeme durumu güncellenemedi.");
        return;
      }

      setTenant((current) => ({ ...current, ...result.tenant }));
      if (paid) setPaidNoteDraft("");
      setMessage(paid ? "Ödeme alındı olarak işaretlendi." : "Ödeme işareti kaldırıldı.");
    });
  }

  function addGiftMonths() {
    setMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gift_months: giftMonths }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Hediye ay eklenemedi.");
        return;
      }

      setTenant((current) => ({ ...current, ...result.tenant }));
      setMessage(`Üyeliğe ${giftMonths} ay hediye eklendi.`);
    });
  }

  // Ücretli paket denemesindeki mağazadan ödeme alındı (0132): deneme biter,
  // mevcut paket 12 aylık kalıcı üyeliğe döner.
  // Ücretli paket denemesi (0132): süper admin paketi ve gün sayısını seçer; süre dolunca
  // cron Ücretsiz'e düşürür. Sonlandırırken ödeme alındıysa seçilen paket kalıcı olur,
  // alınmadıysa mağaza hemen Ücretsiz plana düşer (limit üstü ürünler vitrinden gizlenir).
  function submitTrialDialog() {
    const mode = trialDialog;
    if (!mode) return;
    if (mode === "start" && (!Number.isInteger(trialDaysDraft) || trialDaysDraft < 1 || trialDaysDraft > 365)) {
      setMessage("Gün sayısı 1 ile 365 arasında olmalı.");
      return;
    }
    const body =
      mode === "start"
        ? { start_plan_trial: true, plan: trialPlanDraft, trial_days: trialDaysDraft }
        : trialPaid
          ? { confirm_plan_payment: true, plan: trialPlanDraft }
          : { end_plan_trial: true };
    setMessage(null);
    setTrialDialog(null);

    startTransition(async () => {
      const response = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Deneme durumu güncellenemedi.");
        return;
      }

      setTenant((current) => ({ ...current, ...result.tenant }));
      setPlanDraft(result.tenant?.plan ?? planDraft);
      setMessage(
        mode === "start"
          ? `Hesap ${getPlanLabel(trialPlanDraft)} paketinde ${trialDaysDraft} günlük denemeye alındı.`
          : trialPaid
            ? `Ödeme alındı; ${getPlanLabel(trialPlanDraft)} paketi 12 aylık kalıcı üyeliğe döndü.`
            : "Deneme ödeme alınmadan sonlandırıldı; mağaza Ücretsiz plana düştü, limit üstü ürünler vitrinden gizlendi.",
      );
    });
  }

  function openTrialDialog(mode: "start" | "end") {
    setTrialPlanDraft(
      mode === "end" && tenant.plan && tenant.plan !== "free" ? (tenant.plan as TenantPlan) : "corporate",
    );
    setTrialDaysDraft(14);
    setTrialPaid(true);
    setTrialDialog(mode);
  }

  // Eski Esnaf denemesi (trial_ends_at): yalnız mevcut kayıtlar için sonlandırma kalır.
  function endLegacyTrial() {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ end_trial: true }),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error ?? "Deneme durumu güncellenemedi.");
        return;
      }
      setTenant((current) => ({ ...current, ...result.tenant }));
      setMessage("Deneme süresi sonlandırıldı.");
    });
  }

  function toggleTenantStatus(status: "active" | "suspended") {
    setMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Tenant durumu güncellenemedi.");
        return;
      }

      setTenant((current) => ({ ...current, status: result.tenant.status }));
      setMessage("Tenant durumu güncellendi.");
    });
  }

  function toggleBusinessType(nextType: "general" | "market") {
    setMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_type: nextType }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "İşletme türü güncellenemedi.");
        return;
      }

      setTenant((current) => ({ ...current, business_type: result.tenant.business_type }));
      setMessage(nextType === "market" ? "İşletme türü Market yapıldı." : "İşletme türü Genel yapıldı.");
    });
  }

  // Alkol/sigara bayii (tekel) — yasal olarak dağıtım/teslimat yapamaz.
  // Açıldığında storefront adres toplamayı bırakır, sepet/checkout
  // metinleri "sipariş listesi hazırlama" diline döner (kullanıcı isteği,
  // 20 Ağu 2026).
  function toggleTekel(nextValue: boolean) {
    setMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_tekel: nextValue }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Tekel ayarı güncellenemedi.");
        return;
      }

      setTenant((current) => ({ ...current, is_tekel: result.tenant.is_tekel }));
      setMessage(nextValue ? "Tekel modu açıldı." : "Tekel modu kapatıldı.");
    });
  }

  function revalidateStorefront() {
    setMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/admin/tenants/${tenant.id}/revalidate`, {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Vitrin önbelleği temizlenemedi.");
        return;
      }

      setMessage("Vitrin önbelleği temizlendi. Mağaza sayfası güncel verilerle yeniden oluşturulacak.");
    });
  }

  function setTenantAdminPassword(password: string | null) {
    setMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/admin/tenants/${tenant.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(password ? { password } : {}),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Şifre güncellenemedi.");
        return;
      }

      setResetCredentials({ email: result.email, password: result.temporaryPassword, kind: "reset" });
      setNewPasswordDraft("");
      setMessage("Yönetici şifresi güncellendi.");
    });
  }

  function createTenantAdmin() {
    const email = newAdminEmailDraft.trim();

    if (!email || !email.includes("@")) {
      setMessage("Geçerli bir e-posta adresi girin.");
      return;
    }

    setMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/admin/tenants/${tenant.id}/create-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Yönetici hesabı oluşturulamadı.");
        return;
      }

      setTenant((current) => ({ ...current, has_tenant_admin: true }));
      setResetCredentials({ email: result.email, password: result.temporaryPassword, kind: "create" });
      setNewAdminEmailDraft("");
      setMessage("Yönetici hesabı oluşturuldu.");
    });
  }

  function deleteTenant() {
    const confirmed = window.confirm(
      `${tenant.company_name} tenantını ve bağlı verilerini kalıcı olarak silmek istediğinize emin misiniz?`,
    );

    if (!confirmed) {
      return;
    }

    setMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Tenant silinemedi.");
        return;
      }

      router.push("/admin");
    });
  }

  function createAccessCode() {
    const password_code = codeDraft.trim();
    const price_list_id = priceListDraft || tenant.price_lists?.[0]?.id || "";

    if (!password_code) {
      setMessage("Şifre kodu giriniz.");
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/admin/access-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenant.id,
          password_code,
          price_list_id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Şifre eklenemedi.");
        return;
      }

      setTenant((current) => ({
        ...current,
        access_codes: [result.accessCode as AccessCode, ...(current.access_codes ?? [])],
      }));
      setCodeDraft("");
      setMessage("Şifre eklendi.");
    });
  }

  function deleteAccessCode(accessCodeId: string) {
    setMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/admin/access-codes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: accessCodeId }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Şifre silinemedi.");
        return;
      }

      setTenant((current) => ({
        ...current,
        access_codes: (current.access_codes ?? []).filter(
          (accessCode) => accessCode.id !== accessCodeId,
        ),
      }));
      setMessage("Şifre kaldırıldı.");
    });
  }

  function startEditingAccessCode(accessCode: AccessCode) {
    setEditingAccessCodeId(accessCode.id);
    setEditDrafts((current) => ({
      ...current,
      [accessCode.id]: {
        password_code: accessCode.password_code,
        price_list_id: accessCode.price_list_id,
      },
    }));
  }

  function cancelEditingAccessCode() {
    setEditingAccessCodeId(null);
  }

  function updateAccessCode(accessCodeId: string) {
    const draft = editDrafts[accessCodeId];
    const password_code = draft?.password_code.trim();

    if (!password_code) {
      setMessage("Şifre kodu giriniz.");
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/admin/access-codes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: accessCodeId,
          password_code,
          price_list_id: draft.price_list_id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Şifre güncellenemedi.");
        return;
      }

      setTenant((current) => ({
        ...current,
        access_codes: (current.access_codes ?? []).map((accessCode) =>
          accessCode.id === accessCodeId ? (result.accessCode as AccessCode) : accessCode,
        ),
      }));
      setEditingAccessCodeId(null);
      setMessage("Şifre güncellendi.");
    });
  }

  const trialBadge = getTrialBadge(tenant.trial_ends_at);
  const planTrialDaysLeft = getPlanTrialDaysLeft(tenant);
  const planId = tenant.plan ?? "baslangic";
  const storefrontUrl = tenant.custom_domain ? `https://${tenant.custom_domain}` : `https://${tenant.subdomain}.ekatalox.com`;
  const productLimitLabel = formatEffectiveProductLimit(planId, tenant.product_limit_addon ?? 0);
  const membershipValue = tenant.plan_trial_ends_at
    ? formatDate(tenant.plan_trial_ends_at)
    : tenant.plan_expires_at
      ? formatDate(tenant.plan_expires_at)
      : "Süresiz";
  const membershipHint = tenant.plan_trial_ends_at
    ? planTrialDaysLeft !== null
      ? `Deneme · ${planTrialDaysLeft} gün kaldı`
      : "Deneme bitişi"
    : tenant.plan_expires_at
      ? "Üyelik bitişi"
      : getPlanLabel(planId);
  const isError = message ? /(?:ılamadı|anamadı|emedi|hata|geçersiz)/i.test(message) : false;

  const tabs: Array<{ key: DetailTab; label: string; icon: typeof Package }> = [
    { key: "plan", label: "Paket & Üyelik", icon: Package },
    { key: "access", label: "Erişim & Şifreler", icon: KeyRound },
    ...(tenant.signup_source === "self_service" ? [{ key: "signup" as const, label: "Kayıt bilgileri", icon: ClipboardList }] : []),
    { key: "visits", label: "Panel ziyaretleri", icon: MonitorSmartphone },
    { key: "reports", label: "Raporlar", icon: BarChart3 },
    ...(tenant.business_type === "market" && slots.customers ? [{ key: "customers" as const, label: "Müşteriler", icon: Users }] : []),
    { key: "advanced", label: "Gelişmiş", icon: Settings2 },
  ];

  const priceListOptions = (tenant.price_lists ?? []).map((list) => (
    <option key={list.id} value={list.id}>
      {getPriceListDisplayName(list)}
    </option>
  ));

  return (
    <div className="space-y-5">
      {/* Özet kartı */}
      <Card className="overflow-hidden p-0">
        <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {isEditingName ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    type="text"
                    value={companyNameDraft}
                    onChange={(event) => setCompanyNameDraft(event.target.value)}
                    className="h-10 max-w-[280px] py-2 text-lg font-semibold"
                    aria-label="Firma adı"
                    autoFocus
                    onKeyDown={(event) => {
                      if (event.key === "Enter") saveCompanyName();
                      if (event.key === "Escape") cancelEditingCompanyName();
                    }}
                  />
                  <Button className="h-10 px-3 py-0" onClick={saveCompanyName} disabled={pending || !companyNameDraft.trim()}>
                    <Check className="size-4" />
                    Kaydet
                  </Button>
                  <Button className="h-10 px-3 py-0" variant="secondary" onClick={cancelEditingCompanyName} disabled={pending}>
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <h2 className="group flex items-center gap-2 text-2xl font-extrabold tracking-tight text-slate-900">
                  {tenant.company_name}
                  <button
                    type="button"
                    onClick={() => setIsEditingName(true)}
                    title="Firma adını düzenle"
                    className="rounded-md p-1 text-slate-300 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <Pencil className="size-4" />
                  </button>
                </h2>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge className={cn("px-2.5 py-1 text-xs font-bold uppercase tracking-wide", PLAN_BADGE_CLASS[planId] ?? "bg-slate-500 text-white")}>
                {getPlanLabel(planId)}
              </Badge>
              <Badge className={tenant.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}>
                {tenant.status === "active" ? "Aktif" : "Askıda"}
              </Badge>
              {tenant.plan_paid_at && planId !== "free" ? (
                <Badge className="inline-flex items-center gap-1 bg-emerald-600 text-white">
                  <BadgeCheck className="size-3.5" />
                  Ödeme alındı
                </Badge>
              ) : null}
              {planTrialDaysLeft !== null ? (
                <Badge className="bg-amber-50 text-amber-700">Paket denemesi · {planTrialDaysLeft} gün kaldı</Badge>
              ) : null}
              {trialBadge ? <Badge className={trialBadge.className}>{trialBadge.label}</Badge> : null}
              <Badge className={tenant.business_type === "market" ? "bg-violet-50 text-violet-700" : "bg-slate-100 text-slate-600"}>
                {tenant.business_type === "market" ? "Market" : "Toptancı / Genel"}
              </Badge>
              {tenant.is_tekel ? <Badge className="bg-amber-50 text-amber-700">Tekel</Badge> : null}
              {tenant.is_internal_demo ? <Badge className="bg-sky-50 text-sky-700">Demo mağaza</Badge> : null}
              {tenant.visitor_quota_exceeded ? <Badge className="bg-rose-50 text-rose-700">Ziyaretçi kotası doldu</Badge> : null}
            </div>

            <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <dt className="w-24 shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400">Vitrin</dt>
                <dd className="min-w-0">
                  <a href={storefrontUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-emerald-700 hover:underline">
                    <span className="truncate">{tenant.custom_domain ?? `${tenant.subdomain}.ekatalox.com`}</span>
                    <ExternalLink className="size-3.5 shrink-0" />
                  </a>
                  {tenant.custom_domain ? <span className="ml-2 text-xs text-slate-400">{tenant.subdomain}.ekatalox.com</span> : null}
                </dd>
              </div>
              <div className="flex items-center gap-2">
                <dt className="w-24 shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400">WhatsApp</dt>
                <dd className="text-slate-700">{tenant.whatsapp_number || "—"}</dd>
              </div>
              <div className="flex items-center gap-2">
                <dt className="w-24 shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400">Açılış</dt>
                <dd className="text-slate-700">{formatDate(tenant.created_at)}</dd>
              </div>
              <div className="flex items-center gap-2">
                <dt className="w-24 shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400">Yetkili</dt>
                <dd className="truncate text-slate-700">
                  {tenant.contact_full_name || "—"}
                  {tenant.contact_email ? <span className="text-slate-400"> · {tenant.contact_email}</span> : null}
                </dd>
              </div>
            </dl>
          </div>

          <div className="grid w-full shrink-0 grid-cols-2 gap-2 lg:w-[420px]">
            <StatBox
              icon={Boxes}
              label="Ürün"
              value={`${formatProductLimit(tenant.product_count ?? 0)} / ${productLimitLabel}`}
              hint={tenant.product_limit_addon ? `+${formatProductLimit(tenant.product_limit_addon)} hediye dahil` : "yüklü / limit"}
              tone="slate"
            />
            <StatBox
              icon={Eye}
              label="Ziyaretçi (bu ay)"
              value={`${formatProductLimit(tenant.monthly_visitor_count ?? 0)} / ${formatVisitorLimit(planId, tenant.visitor_limit_addon ?? 0)}`}
              hint={tenant.visitor_quota_exceeded ? "Kota doldu" : "ziyaretçi / kota"}
              tone={tenant.visitor_quota_exceeded ? "rose" : "slate"}
            />
            <StatBox
              icon={MonitorSmartphone}
              label="Panel"
              value={formatTimeAgo(tenant.last_panel_seen_at, "Hiç girmedi")}
              hint={tenant.has_tenant_admin ? "son görülme" : "yönetici hesabı yok"}
              tone={tenant.last_panel_seen_at ? "emerald" : "amber"}
            />
            <StatBox
              icon={CalendarClock}
              label="Üyelik"
              value={membershipValue}
              hint={membershipHint}
              tone={planTrialDaysLeft !== null ? "amber" : "slate"}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-3">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Hızlı işlemler</span>
          <Button variant="secondary" onClick={revalidateStorefront} disabled={pending} className="h-9 px-3 py-0 text-xs">
            Vitrini yenile
          </Button>
          <Button
            variant="secondary"
            onClick={() => openTrialDialog(tenant.plan_trial_ends_at ? "end" : "start")}
            disabled={pending}
            className="h-9 border-amber-200 px-3 py-0 text-xs text-amber-700 hover:bg-amber-50 hover:text-amber-800"
          >
            {tenant.plan_trial_ends_at ? "Denemeyi sonlandır" : "Denemeye al"}
          </Button>
          {tenant.trial_ends_at ? (
            <Button variant="secondary" onClick={endLegacyTrial} disabled={pending} className="h-9 px-3 py-0 text-xs">
              Eski denemeyi sonlandır
            </Button>
          ) : null}
          <Button
            variant="secondary"
            onClick={() => toggleTenantStatus(tenant.status === "active" ? "suspended" : "active")}
            disabled={pending}
            className={cn("h-9 px-3 py-0 text-xs", tenant.status === "active" ? "text-slate-700" : "border-emerald-200 text-emerald-700 hover:bg-emerald-50")}
          >
            {tenant.status === "active" ? "Askıya al" : "Yeniden aç"}
          </Button>
          <Button asChild variant="secondary" href={`/admin/basvurular`} className="h-9 px-3 py-0 text-xs">
            Başvurular
          </Button>
        </div>
      </Card>

      {message ? (
        <div
          className={cn(
            "flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm",
            isError ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-100 bg-emerald-50 text-emerald-800",
          )}
        >
          <span>{message}</span>
          <button type="button" onClick={() => setMessage(null)} className="shrink-0 opacity-60 hover:opacity-100" aria-label="Kapat">
            <X className="size-4" />
          </button>
        </div>
      ) : null}

      <Card className="overflow-hidden p-0">
        <SettingsTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} layoutId="admin-tenant-detail-tabs" />
      </Card>

      {/* ---------------- Paket & Üyelik ---------------- */}
      {activeTab === "plan" ? (
        <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <SectionCard
            title="Paket ve kapasite"
            description={
              <>
                Mevcut: <span className="font-medium text-slate-700">{getPlanLabel(planId)}</span> · {productLimitLabel} ürün ·{" "}
                {formatVisitorLimit(planId, tenant.visitor_limit_addon ?? 0)} ziyaretçi / ay
              </>
            }
          >
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-3">
                <label className="text-xs font-medium text-slate-500">Paket</label>
                <Select value={planDraft} onChange={(event) => setPlanDraft(event.target.value as TenantPlan)} className="mt-1.5">
                  {/* Eski paketler (vip, pro, start…) listede gösterilmez (29 Eyl 2026);
                      tenant hâlâ eskisindeyse yalnız onun satırı eklenir. */}
                  {PLAN_OPTIONS.filter((plan) => TOPTAN_PLAN_OPTIONS.includes(plan) || plan.id === planId).map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} ({plan.id}) — {formatProductLimit(plan.maxProductLimit)} ürün
                    </option>
                  ))}
                </Select>
                {planDraft !== planId && planDraft !== "free" ? (
                  <Input
                    value={planCouponDraft}
                    onChange={(event) => setPlanCouponDraft(event.target.value.toUpperCase())}
                    placeholder="Kupon kodu (varsa)"
                    maxLength={32}
                    spellCheck={false}
                    className="mt-2 max-w-[280px] font-mono uppercase"
                  />
                ) : null}
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Ek ziyaretçi kotası</label>
                <Input
                  type="number"
                  min={0}
                  step={1000}
                  placeholder="ör. 25000"
                  value={String(visitorAddonDraft)}
                  onChange={(event) => setVisitorAddonDraft(Math.max(0, Number(event.target.value) || 0))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Hediye ürün kapasitesi</label>
                <Input
                  type="number"
                  min={0}
                  step={50}
                  placeholder="ör. 250"
                  value={String(productAddonDraft)}
                  onChange={(event) => setProductAddonDraft(Math.max(0, Number(event.target.value) || 0))}
                  className="mt-1.5"
                />
              </div>
              <div className="flex items-end justify-end">
                <Button onClick={saveChanges} disabled={pending || !hasPendingChanges} className="w-full md:w-auto">
                  {hasPendingChanges ? "Değişiklikleri kaydet" : "Kaydedildi"}
                </Button>
              </div>
            </div>
          </SectionCard>

          <div className="space-y-4">
            <SectionCard
              title="Ödeme"
              description={
                tenant.plan_paid_at ? (
                  <span className="inline-flex flex-wrap items-center gap-1.5 text-emerald-700">
                    <BadgeCheck className="size-4" />
                    Ödeme alındı · {formatDate(tenant.plan_paid_at)}
                    {tenant.plan_paid_note ? <span className="text-slate-500">— {tenant.plan_paid_note}</span> : null}
                  </span>
                ) : (
                  "Bu mağaza için ödeme kaydı yok."
                )
              }
            >
              {tenant.plan_paid_at ? (
                <Button variant="secondary" onClick={() => setPlanPaid(false)} disabled={pending}>
                  İşareti kaldır
                </Button>
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={paidNoteDraft}
                    onChange={(event) => setPaidNoteDraft(event.target.value)}
                    placeholder="Not (ör. 5.000 ₺ havale)"
                    maxLength={200}
                  />
                  <Button onClick={() => setPlanPaid(true)} disabled={pending} className="shrink-0">
                    Ödeme alındı
                  </Button>
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Üyelik süresi"
              description={
                tenant.plan_expires_at ? (
                  <>Bitiş: <span className="font-medium text-slate-700">{formatDate(tenant.plan_expires_at)}</span></>
                ) : (
                  "Bitiş tarihi tanımlı değil."
                )
              }
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Select value={giftMonths} onChange={(event) => setGiftMonths(Number(event.target.value))} className="sm:w-28">
                  {[1, 2, 3, 6, 12].map((months) => (
                    <option key={months} value={months}>
                      +{months} ay
                    </option>
                  ))}
                </Select>
                <Button
                  variant="secondary"
                  onClick={addGiftMonths}
                  disabled={pending}
                  className="border-violet-200 text-violet-700 hover:bg-violet-50 hover:text-violet-800"
                >
                  Üyeliğe hediye ay ekle
                </Button>
              </div>
            </SectionCard>
          </div>
        </div>
      ) : null}

      {/* ---------------- Erişim & Şifreler ---------------- */}
      {activeTab === "access" ? (
        <div className="space-y-4">
          {tenant.has_tenant_admin ? (
            <SectionCard
              title="Yönetici paneli şifresi"
              description="Tenant admin'in /dashboard giriş şifresini burada belirleyin veya rastgele oluşturun. Mevcut şifre anında geçersiz olur."
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input
                  type="text"
                  placeholder="Yeni şifre (en az 6 karakter)"
                  value={newPasswordDraft}
                  onChange={(event) => setNewPasswordDraft(event.target.value)}
                  className="max-w-[280px]"
                />
                <Button
                  variant="secondary"
                  onClick={() => setTenantAdminPassword(newPasswordDraft.trim())}
                  disabled={pending || newPasswordDraft.trim().length < 6}
                  className="border-violet-200 text-violet-700 hover:bg-violet-50 hover:text-violet-800"
                >
                  Bu şifreyi ayarla
                </Button>
                <Button variant="secondary" onClick={() => setTenantAdminPassword(null)} disabled={pending}>
                  Rastgele şifre oluştur
                </Button>
              </div>
            </SectionCard>
          ) : (
            <SectionCard
              tone="warning"
              title="Yönetici hesabı yok"
              description="Bu tenant için henüz bir /dashboard giriş hesabı oluşturulmamış. E-posta girip hesabı oluşturun; geçici şifre bir kereliğine burada gösterilecek."
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input
                  type="email"
                  placeholder="yonetici@ornek.com"
                  value={newAdminEmailDraft}
                  onChange={(event) => setNewAdminEmailDraft(event.target.value)}
                  className="max-w-[280px]"
                />
                <Button
                  variant="secondary"
                  onClick={createTenantAdmin}
                  disabled={pending || !newAdminEmailDraft.trim()}
                  className="border-violet-200 text-violet-700 hover:bg-violet-50 hover:text-violet-800"
                >
                  Yönetici hesabı oluştur
                </Button>
              </div>
            </SectionCard>
          )}

          <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <SectionCard
              title="Vitrin şifreleri"
              description={`Müşterilerin kapıda girdiği şifreler ve bağlı fiyat listeleri · ${(tenant.access_codes ?? []).length} şifre`}
            >
              {(tenant.access_codes ?? []).length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                  Henüz vitrin şifresi yok. Sağdaki formdan ekleyin.
                </p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  {(tenant.access_codes ?? []).map((accessCode) => {
                    const isEditing = editingAccessCodeId === accessCode.id;
                    const draft = editDrafts[accessCode.id];
                    return (
                      <div
                        key={accessCode.id}
                        className={cn(
                          "flex flex-col gap-2 border-b border-slate-100 px-4 py-2.5 last:border-b-0 sm:flex-row sm:items-center",
                          isEditing && "bg-amber-50/50",
                        )}
                      >
                        {isEditing && draft ? (
                          <>
                            <Input
                              placeholder="1111"
                              value={draft.password_code}
                              onChange={(event) =>
                                setEditDrafts((current) => ({
                                  ...current,
                                  [accessCode.id]: { ...current[accessCode.id], password_code: event.target.value },
                                }))
                              }
                              className="h-9 font-mono sm:max-w-[140px]"
                            />
                            <Select
                              value={draft.price_list_id}
                              onChange={(event) =>
                                setEditDrafts((current) => ({
                                  ...current,
                                  [accessCode.id]: { ...current[accessCode.id], price_list_id: event.target.value },
                                }))
                              }
                              className="h-9 flex-1"
                            >
                              {priceListOptions}
                            </Select>
                            <div className="flex gap-2">
                              <Button className="h-9 px-3 py-0" onClick={() => updateAccessCode(accessCode.id)} disabled={pending}>
                                Kaydet
                              </Button>
                              <Button className="h-9 px-3 py-0" variant="secondary" onClick={cancelEditingAccessCode} disabled={pending}>
                                İptal
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <span className="inline-flex w-fit items-center rounded-md bg-slate-900 px-2.5 py-1 font-mono text-sm font-bold tracking-widest text-white">
                              {accessCode.password_code}
                            </span>
                            <span className="flex-1 text-sm text-slate-600">
                              {accessCode.price_list_name ? normalizePriceListName(accessCode.price_list_name) : "Fiyat listesi"}
                            </span>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => startEditingAccessCode(accessCode)}
                                className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                              >
                                Düzenle
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteAccessCode(accessCode.id)}
                                className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-700"
                              >
                                Sil
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Yeni vitrin şifresi" description="Şifre ve açılacağı fiyat listesi.">
              <div className="grid gap-3">
                <Input placeholder="1111" value={codeDraft} onChange={(event) => setCodeDraft(event.target.value)} className="font-mono" />
                <Select value={priceListDraft || tenant.price_lists?.[0]?.id || ""} onChange={(event) => setPriceListDraft(event.target.value)}>
                  {priceListOptions}
                </Select>
                <Button onClick={createAccessCode} disabled={pending || !codeDraft.trim()}>
                  Şifre kaydet
                </Button>
              </div>
            </SectionCard>
          </div>
        </div>
      ) : null}

      {/* ---------------- Kayıt bilgileri ---------------- */}
      {activeTab === "signup" ? (
        <SectionCard
          title="Kayıt bilgileri"
          description={
            <>
              Esnaf kayıt formundan gelen bilgiler; salt okunur. Başvuru kaydı için{" "}
              <Link href="/admin/basvurular" className="font-medium text-emerald-700 hover:underline">
                Başvurular
              </Link>{" "}
              sayfasına bakın.
            </>
          }
        >
          <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <SignupInfoField label="Sektör" value={sectorLabel} />
            <SignupInfoField label="Ödeme dönemi" value={billingPeriodLabel} />
            <SignupInfoField label="Kupon" value={tenant.coupon_code} mono />
            <SignupInfoField label="Yetkili" value={tenant.contact_full_name} />
            <SignupInfoField label="E-posta" value={tenant.contact_email} />
            <SignupInfoField label="İl / İlçe" value={cityDistrict} />
            <SignupInfoField label="Mahalle" value={billingAddress?.neighborhood} />
            <SignupInfoField label="Adres" value={billingAddress?.address} className="sm:col-span-2" />
            <SignupInfoField label="Vergi dairesi" value={billingAddress?.tax_office} />
            <SignupInfoField label="Vergi no" value={billingAddress?.tax_number} mono />
            <SignupInfoField
              label="İlk sipariş e-postası"
              value={tenant.first_order_email_sent_at ? formatDate(tenant.first_order_email_sent_at) : null}
            />
            <SignupInfoField
              label="Deneme hatırlatması"
              value={tenant.trial_reminder_sent_at ? formatDate(tenant.trial_reminder_sent_at) : null}
            />
          </dl>
        </SectionCard>
      ) : null}

      {/* ---------------- Panel ziyaretleri / Raporlar / Müşteriler (sunucu bölümleri) ---------------- */}
      {activeTab === "visits" ? slots.visits ?? null : null}
      {activeTab === "reports" ? slots.reports ?? null : null}
      {activeTab === "customers" ? slots.customers ?? null : null}

      {/* ---------------- Gelişmiş ---------------- */}
      {activeTab === "advanced" ? (
        <div className="space-y-4">
          <SectionCard
            title="Özel alan adı"
            description="Müşterinin istediği alan adını (ör. katalog.firma.com) DNS/Vercel tarafında bağladıktan sonra burada tanımlayın. Tenant admin paneli üzerinden bu alan değiştirilemez — yalnızca siz güncelleyebilirsiniz."
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                type="text"
                placeholder="katalog.firma.com"
                value={customDomainDraft}
                onChange={(event) => setCustomDomainDraft(event.target.value)}
                className="max-w-[280px]"
              />
              <Button
                variant="secondary"
                onClick={() => saveCustomDomain()}
                disabled={pending || customDomainDraft.trim() === (tenant.custom_domain ?? "")}
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
              >
                Kaydet
              </Button>
              {tenant.custom_domain ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setCustomDomainDraft("");
                    saveCustomDomain("");
                  }}
                  disabled={pending}
                  className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                >
                  Kaldır
                </Button>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard
            title="Mağaza türü ve görünürlük"
            description="Tür değişimi vitrin akışını (sepet, sipariş, ödeme) değiştirir; müşteriyle konuşmadan değiştirmeyin."
          >
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">İşletme türü</p>
                  <p className="text-xs text-slate-500">
                    Şu an: {tenant.business_type === "market" ? "Market (sepet + sipariş akışı)" : "Toptancı / genel işletme"}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => toggleBusinessType(tenant.business_type === "market" ? "general" : "market")}
                  disabled={pending}
                  className="h-9 border-violet-200 px-3 py-0 text-xs text-violet-700 hover:bg-violet-50 hover:text-violet-800"
                >
                  {tenant.business_type === "market" ? "Genel işletme yap" : "Market yap"}
                </Button>
              </div>
              {tenant.business_type === "market" ? (
                <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Tekel modu</p>
                    <p className="text-xs text-slate-500">{tenant.is_tekel ? "Açık — dağıtım yok, teslim al" : "Kapalı"}</p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => toggleTekel(!tenant.is_tekel)}
                    disabled={pending}
                    className="h-9 border-amber-200 px-3 py-0 text-xs text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                  >
                    {tenant.is_tekel ? "Tekel modunu kapat" : "Tekel yap (dağıtım yok)"}
                  </Button>
                </div>
              ) : null}
              <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">Liste grubu</p>
                  <p className="text-xs text-slate-500">
                    {tenant.is_internal_demo ? "Demo mağazalar grubunda (müşteri sayılmaz)" : "Müşteriler grubunda"}
                  </p>
                </div>
                <Button variant="secondary" onClick={() => setInternalDemo(!tenant.is_internal_demo)} disabled={pending} className="h-9 px-3 py-0 text-xs">
                  {tenant.is_internal_demo ? "Müşterilere taşı" : "Demo mağazalara taşı"}
                </Button>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            tone="danger"
            title="Tehlikeli bölge"
            description="Mağazayı, ürünlerini, siparişlerini ve yönetici hesabını kalıcı olarak siler. Geri alınamaz."
          >
            <Button variant="secondary" onClick={deleteTenant} disabled={pending} className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800">
              <AlertTriangle className="size-4" />
              Mağazayı tamamen sil
            </Button>
          </SectionCard>
        </div>
      ) : null}

      <Modal
        open={trialDialog !== null}
        onClose={() => setTrialDialog(null)}
        title={trialDialog === "start" ? "Denemeye al" : "Denemeyi sonlandır"}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setTrialDialog(null)} disabled={pending}>
              Vazgeç
            </Button>
            <Button onClick={submitTrialDialog} disabled={pending}>
              {trialDialog === "start" ? "Denemeyi başlat" : trialPaid ? "Ödeme alındı, paketi kalıcı yap" : "Ücretsiz plana düşür"}
            </Button>
          </div>
        }
      >
        {trialDialog === "start" ? (
          <div className="space-y-4 text-sm text-slate-600">
            <p>Mağaza seçilen paketle belirtilen gün kadar denemeye alınır. Süre dolduğunda siz bir şey yapmazsanız otomatik olarak Ücretsiz plana düşer; limit üstündeki ürünler silinmez, yalnız vitrinden gizlenir.</p>
            <label className="block text-sm font-medium text-slate-700">Paket</label>
            <Select value={trialPlanDraft} onChange={(event) => setTrialPlanDraft(event.target.value as TenantPlan)}>
              {TOPTAN_PLAN_OPTIONS.filter((plan) => plan.id !== "free").map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} — {formatProductLimit(plan.maxProductLimit)} ürün
                </option>
              ))}
            </Select>
            <label className="block text-sm font-medium text-slate-700">Kaç gün?</label>
            <Input
              type="number"
              min={1}
              max={365}
              value={trialDaysDraft}
              onChange={(event) => setTrialDaysDraft(Number.parseInt(event.target.value, 10) || 0)}
            />
          </div>
        ) : (
          <div className="space-y-4 text-sm text-slate-600">
            <p>Ödeme alındı mı?</p>
            <label className="flex items-center gap-2">
              <input type="radio" name="trial_paid" checked={trialPaid} onChange={() => setTrialPaid(true)} />
              Evet, ödeme alındı — seçilen paket 12 ay kalıcı olsun
            </label>
            {trialPaid ? (
              <div className="space-y-1.5 pl-6">
                <label className="block text-sm font-medium text-slate-700">Paket</label>
                <Select value={trialPlanDraft} onChange={(event) => setTrialPlanDraft(event.target.value as TenantPlan)}>
                  {TOPTAN_PLAN_OPTIONS.filter((plan) => plan.id !== "free").map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} — {formatProductLimit(plan.maxProductLimit)} ürün
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}
            <label className="flex items-center gap-2">
              <input type="radio" name="trial_paid" checked={!trialPaid} onChange={() => setTrialPaid(false)} />
              Hayır — mağaza Ücretsiz plana düşsün (limit üstü ürünler vitrinden gizlenir)
            </label>
          </div>
        )}
      </Modal>
      <Modal
        open={Boolean(resetCredentials)}
        onClose={() => setResetCredentials(null)}
        title={resetCredentials?.kind === "create" ? "Yönetici hesabı oluşturuldu" : "Yönetici şifresi güncellendi"}
      >
        {resetCredentials ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
              <p>
                <span className="font-medium text-slate-900">Giriş adresi:</span>{" "}
                {resetCredentials.email}
              </p>
              <p className="mt-2">
                <span className="font-medium text-slate-900">
                  {resetCredentials.kind === "create" ? "Geçici şifre:" : "Yeni şifre:"}
                </span>{" "}
                {resetCredentials.password}
              </p>
              <p className="mt-2">
                <span className="font-medium text-slate-900">Panel:</span> app.ekatalox.com
              </p>
            </div>

            <p className="text-sm text-amber-700">
              Bu şifre yalnız bir kez burada gösterilir. Lütfen şimdi kaydedin ve müşteriye
              WhatsApp üzerinden iletin.
            </p>

            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setResetCredentials(null)}>
                Kapat
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
