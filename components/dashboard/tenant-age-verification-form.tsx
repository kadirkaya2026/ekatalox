"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SettingsSectionHeader } from "@/components/dashboard/settings-section-header";
import { InlineAlert } from "@/components/ui/inline-alert";
import type { Tenant } from "@/lib/types";

export function TenantAgeVerificationForm({ tenant }: { tenant: Tenant }) {
  const [isActive, setIsActive] = useState(tenant.age_verification_required);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function toggle() {
    const next = !isActive;
    setIsActive(next);
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/tenant/settings/age-verification", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ age_verification_required: next }),
      });

      const result = await response.json();

      if (!response.ok) {
        setIsActive(!next);
        setError(result.error ?? "Yaş doğrulama ayarı kaydedilemedi.");
        return;
      }

      setMessage("Yaş doğrulama ayarı kaydedildi.");
      router.refresh();
    });
  }

  return (
    <Card className="p-5">
      <SettingsSectionHeader icon={ShieldCheck} title="18+ Yaş Doğrulama" />
      <p className="mb-4 text-sm text-slate-500">
        Açtığınızda, mağazanıza gelen ziyaretçiler herhangi bir içeriği görmeden önce
        &quot;18 yaşımdan büyüğüm&quot; onayı vermek zorunda kalır. Onay veren ziyaretçi
        cihazında hatırlanır, tekrar sorulmaz. Kapalıyken mağazanız doğrudan (mevcut şifre
        ayarınıza göre) açılır.
      </p>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Yaş doğrulama iste</p>
            <p className="mt-1 text-sm text-slate-500">
              Switch kapalıyken ziyaretçiden yaş onayı istenmez.
            </p>
          </div>
          <button
            type="button"
            onClick={toggle}
            aria-pressed={isActive}
            disabled={pending}
            className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition ${
              isActive ? "bg-emerald-600" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition ${
                isActive ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>
      </div>

      <div className="mt-4 min-h-6">
        <InlineAlert message={message} onExpire={() => setMessage(null)} />
        <InlineAlert message={error} tone="error" onExpire={() => setError(null)} />
      </div>
    </Card>
  );
}
