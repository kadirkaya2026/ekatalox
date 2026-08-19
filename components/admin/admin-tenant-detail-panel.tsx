"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import {
  formatEffectiveProductLimit,
  formatProductLimit,
  formatVisitorLimit,
  getPlanLabel,
  PLAN_OPTIONS,
} from "@/lib/billing/plans";
import { getPriceListDisplayName, normalizePriceListName } from "@/lib/price-lists/constants";
import type { AccessCode, TenantPlan, TenantWithRelations } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

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

export function AdminTenantDetailPanel({ tenant: initialTenant }: { tenant: TenantWithRelations }) {
  const router = useRouter();
  const [tenant, setTenant] = useState(initialTenant);
  const [isEditingName, setIsEditingName] = useState(false);
  const [companyNameDraft, setCompanyNameDraft] = useState(tenant.company_name);
  const [planDraft, setPlanDraft] = useState<TenantPlan>(tenant.plan ?? "baslangic");
  const [visitorAddonDraft, setVisitorAddonDraft] = useState(tenant.visitor_limit_addon ?? 0);
  const [productAddonDraft, setProductAddonDraft] = useState(tenant.product_limit_addon ?? 0);
  const [customDomainDraft, setCustomDomainDraft] = useState(tenant.custom_domain ?? "");
  const [giftMonths, setGiftMonths] = useState(1);
  const [codeDraft, setCodeDraft] = useState("");
  const [priceListDraft, setPriceListDraft] = useState(tenant.price_lists?.[0]?.id ?? "");
  const [editingAccessCodeId, setEditingAccessCodeId] = useState<string | null>(null);
  const [editDrafts, setEditDrafts] = useState<
    Record<string, { password_code: string; price_list_id: string }>
  >({});
  const [message, setMessage] = useState<string | null>(null);
  const [newPasswordDraft, setNewPasswordDraft] = useState("");
  const [newAdminEmailDraft, setNewAdminEmailDraft] = useState("");
  const [resetCredentials, setResetCredentials] = useState<{
    email: string;
    password: string;
    kind: "reset" | "create";
  } | null>(null);
  const [pending, startTransition] = useTransition();

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
      setMessage("Değişiklikler kaydedildi.");
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

  function toggleTenantTrial(action: "start" | "end") {
    setMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "start" ? { start_trial: true } : { end_trial: true }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Deneme durumu güncellenemedi.");
        return;
      }

      setTenant((current) => ({ ...current, ...result.tenant }));
      setMessage(
        action === "start"
          ? "Hesap 14 günlük deneme süresine alındı."
          : "Deneme süresi sonlandırıldı.",
      );
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

  return (
    <div className="space-y-6">
      <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-700">
        ← Tenant listesine dön
      </Link>

      <Card className="p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              {isEditingName ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    type="text"
                    value={companyNameDraft}
                    onChange={(event) => setCompanyNameDraft(event.target.value)}
                    className="h-9 max-w-[260px] py-2"
                    aria-label="Firma adı"
                    autoFocus
                  />
                  <Button
                    className="px-3 py-2"
                    onClick={saveCompanyName}
                    disabled={pending || !companyNameDraft.trim()}
                  >
                    Kaydet
                  </Button>
                  <Button
                    className="px-3 py-2"
                    variant="secondary"
                    onClick={cancelEditingCompanyName}
                    disabled={pending}
                  >
                    İptal
                  </Button>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-semibold text-slate-900">{tenant.company_name}</h2>
                  <button
                    type="button"
                    onClick={() => setIsEditingName(true)}
                    className="text-sm text-slate-400 transition hover:text-slate-900"
                  >
                    Düzenle
                  </button>
                </>
              )}
              <Badge
                className={cn(
                  tenant.status === "active"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500",
                )}
              >
                {tenant.status === "active" ? "Aktif" : "Askıda"}
              </Badge>
              {trialBadge ? <Badge className={trialBadge.className}>{trialBadge.label}</Badge> : null}
              {tenant.business_type === "market" ? (
                <Badge className="bg-violet-50 text-violet-700">Market</Badge>
              ) : null}
              {tenant.is_tekel ? (
                <Badge className="bg-amber-50 text-amber-700">Tekel</Badge>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {tenant.subdomain}.ekatalox.com
            </p>
            {tenant.custom_domain ? (
              <p className="mt-1 text-sm text-slate-600">Özel alan adı: {tenant.custom_domain}</p>
            ) : null}
            <p className="mt-1 text-sm text-slate-500">
              WhatsApp: {tenant.whatsapp_number || "—"} • Açılış: {formatDate(tenant.created_at)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => toggleTenantTrial(tenant.trial_ends_at ? "end" : "start")}
              disabled={pending}
              className="border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
            >
              {tenant.trial_ends_at ? "Denemeyi sonlandır" : "Denemeye al"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => toggleTenantStatus(tenant.status === "active" ? "suspended" : "active")}
              disabled={pending}
            >
              {tenant.status === "active" ? "Askıya al" : "Yeniden aç"}
            </Button>
            <Button
              variant="secondary"
              onClick={revalidateStorefront}
              disabled={pending}
            >
              Vitrini yenile
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                toggleBusinessType(tenant.business_type === "market" ? "general" : "market")
              }
              disabled={pending}
              className="border-violet-200 text-violet-700 hover:bg-violet-50 hover:text-violet-800"
            >
              {tenant.business_type === "market" ? "Genel işletme yap" : "Market yap"}
            </Button>
            {tenant.business_type === "market" ? (
              <Button
                variant="secondary"
                onClick={() => toggleTekel(!tenant.is_tekel)}
                disabled={pending}
                className="border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
              >
                {tenant.is_tekel ? "Tekel modunu kapat" : "Tekel yap (dağıtım yok)"}
              </Button>
            ) : null}
            <Button
              variant="secondary"
              onClick={deleteTenant}
              disabled={pending}
              className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
            >
              Tamamen sil
            </Button>
          </div>
        </div>
      </Card>

      {tenant.has_tenant_admin ? (
        <Card className="p-5">
          <p className="text-sm font-semibold text-slate-900">Yönetici paneli şifresi</p>
          <p className="mt-1 text-sm text-slate-500">
            Tenant admin&apos;in /dashboard giriş şifresini burada belirleyin veya rastgele
            oluşturun. Mevcut şifre anında geçersiz olur.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
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
        </Card>
      ) : (
        <Card className="p-5 border-amber-200 bg-amber-50/40">
          <p className="text-sm font-semibold text-slate-900">Yönetici hesabı yok</p>
          <p className="mt-1 text-sm text-slate-500">
            Bu tenant için henüz bir /dashboard giriş hesabı oluşturulmamış. E-posta girip
            hesabı oluşturun; geçici şifre bir kereliğine burada gösterilecek.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
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
              Yönetici Hesabı Oluştur
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-5">
        <p className="text-sm font-semibold text-slate-900">Özel alan adı</p>
        <p className="mt-1 text-sm text-slate-500">
          Müşterinin istediği alan adını (ör. katalog.firma.com) DNS/Vercel tarafında
          bağladıktan sonra burada tanımlayın. Tenant admin paneli üzerinden bu alan
          artık değiştirilemez — yalnızca siz güncelleyebilirsiniz.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
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
      </Card>

      {message ? (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}

      <Card className="p-5">
        <p className="text-sm font-semibold text-slate-900">Paket ve kapasite</p>
        <p className="mt-1 text-sm text-slate-500">
          Kullanım: {formatProductLimit(tenant.product_count ?? 0)} ürün yüklü •{" "}
          {formatProductLimit(tenant.monthly_visitor_count ?? 0)} ziyaretçi (bu ay)
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-slate-500">Paket</label>
            <Select
              value={planDraft}
              onChange={(event) => setPlanDraft(event.target.value as TenantPlan)}
              className="mt-1.5"
            >
              {PLAN_OPTIONS.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} — {formatProductLimit(plan.maxProductLimit)} ürün
                </option>
              ))}
            </Select>
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
        </div>

        <p className="mt-4 text-sm text-slate-500">
          Mevcut: {getPlanLabel(tenant.plan ?? "baslangic")} •{" "}
          {formatEffectiveProductLimit(tenant.plan ?? "baslangic", tenant.product_limit_addon ?? 0)} ürün
          {tenant.product_limit_addon ? (
            <span className="ml-2 inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
              +{formatProductLimit(tenant.product_limit_addon)} hediye
            </span>
          ) : null}
          {tenant.plan_expires_at ? <> • Üyelik bitişi: {formatDate(tenant.plan_expires_at)}</> : null}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Ziyaretçi kotası: {formatVisitorLimit(tenant.plan ?? "baslangic", tenant.visitor_limit_addon ?? 0)} / ay
          {tenant.visitor_quota_exceeded ? (
            <span className="ml-2 inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">
              Kota doldu
            </span>
          ) : null}
        </p>

        <div className="mt-4 flex justify-end border-t border-slate-100 pt-4">
          <Button onClick={saveChanges} disabled={pending || !hasPendingChanges}>
            Kaydet
          </Button>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
          <Select
            value={giftMonths}
            onChange={(event) => setGiftMonths(Number(event.target.value))}
          >
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
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-4">
          <p className="text-sm font-semibold text-slate-900">Şifre yönetimi</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(tenant.access_codes ?? []).map((accessCode) => {
              const isEditing = editingAccessCodeId === accessCode.id;
              const draft = editDrafts[accessCode.id];

              if (isEditing && draft) {
                return (
                  <div
                    key={accessCode.id}
                    className="flex w-full flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center"
                  >
                    <Input
                      placeholder="1111"
                      value={draft.password_code}
                      onChange={(event) =>
                        setEditDrafts((current) => ({
                          ...current,
                          [accessCode.id]: {
                            ...current[accessCode.id],
                            password_code: event.target.value,
                          },
                        }))
                      }
                      className="sm:max-w-[140px]"
                    />
                    <Select
                      value={draft.price_list_id}
                      onChange={(event) =>
                        setEditDrafts((current) => ({
                          ...current,
                          [accessCode.id]: {
                            ...current[accessCode.id],
                            price_list_id: event.target.value,
                          },
                        }))
                      }
                    >
                      {(tenant.price_lists ?? []).map((list) => (
                        <option key={list.id} value={list.id}>
                          {getPriceListDisplayName(list)}
                        </option>
                      ))}
                    </Select>
                    <div className="flex gap-2">
                      <Button
                        className="px-3 py-2"
                        onClick={() => updateAccessCode(accessCode.id)}
                        disabled={pending}
                      >
                        Kaydet
                      </Button>
                      <Button
                        className="px-3 py-2"
                        variant="secondary"
                        onClick={cancelEditingAccessCode}
                        disabled={pending}
                      >
                        İptal
                      </Button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={accessCode.id}
                  className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm shadow-sm"
                >
                  <span className="font-semibold text-slate-900">{accessCode.password_code}</span>
                  <span className="text-slate-500">
                    {accessCode.price_list_name
                      ? normalizePriceListName(accessCode.price_list_name)
                      : "Fiyat listesi"}
                  </span>
                  <button
                    type="button"
                    onClick={() => startEditingAccessCode(accessCode)}
                    className="text-slate-400 transition hover:text-slate-900"
                  >
                    Düzenle
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteAccessCode(accessCode.id)}
                    className="text-slate-400 transition hover:text-slate-900"
                  >
                    Sil
                  </button>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-sm font-semibold text-slate-900">Yeni şifre ekle</p>
          <div className="mt-4 grid gap-3">
            <Input placeholder="1111" value={codeDraft} onChange={(event) => setCodeDraft(event.target.value)} />
            <Select
              value={priceListDraft || tenant.price_lists?.[0]?.id || ""}
              onChange={(event) => setPriceListDraft(event.target.value)}
            >
              {(tenant.price_lists ?? []).map((list) => (
                <option key={list.id} value={list.id}>
                  {getPriceListDisplayName(list)}
                </option>
              ))}
            </Select>
            <Button onClick={createAccessCode} disabled={pending}>
              Şifre kaydet
            </Button>
          </div>
        </Card>
      </div>

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
