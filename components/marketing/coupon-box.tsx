"use client";

// Kupon kutusu: fiyatlandırma sayfası ve başvuru formu aynı bileşeni kullanır.
// GET /api/kupon/dogrula?code=&plan=&period= çağırır (API başka bir ekip
// tarafından yazılıyor; burada yalnız sözleşmeye uyulur).
import { useState } from "react";
import type { BillingPeriod, EsnafPlanSlug } from "@/lib/billing/esnaf-plans";
import { formatTry } from "@/lib/billing/esnaf-plans";
import { Input } from "@/components/ui/input";
import { Field, fieldInputClass } from "@/components/marketing/form-field";
import { cn } from "@/lib/utils";

export type CouponResult =
  | {
      valid: true;
      code: string;
      message: string;
      listPrice: number;
      finalPrice: number;
      discountType: "percent" | "amount";
      discountValue: number;
    }
  | { valid: false; code: string; message: string };

export async function validateCoupon(code: string, plan: EsnafPlanSlug, period: BillingPeriod): Promise<CouponResult> {
  const trimmed = code.trim().toLocaleUpperCase("tr-TR");
  try {
    const params = new URLSearchParams({ code: trimmed, plan, period });
    const res = await fetch(`/api/kupon/dogrula?${params.toString()}`, { headers: { Accept: "application/json" } });
    const data = (await res.json().catch(() => null)) as Partial<CouponResult> | null;
    if (!res.ok || !data) {
      return { valid: false, code: trimmed, message: (data && "message" in data && data.message) || "Kupon şu an doğrulanamadı. Biraz sonra tekrar deneyin." };
    }
    if (data.valid === true && typeof data.finalPrice === "number" && typeof data.listPrice === "number") {
      return {
        valid: true,
        code: trimmed,
        message: data.message ?? "Kupon uygulandı.",
        listPrice: data.listPrice,
        finalPrice: data.finalPrice,
        discountType: data.discountType === "amount" ? "amount" : "percent",
        discountValue: typeof data.discountValue === "number" ? data.discountValue : 0,
      };
    }
    return { valid: false, code: trimmed, message: data.message ?? "Kupon kodu geçersiz." };
  } catch {
    return { valid: false, code: trimmed, message: "Bağlantı kurulamadı. İnternetinizi kontrol edip tekrar deneyin." };
  }
}

export function CouponBox({
  plan,
  period,
  value,
  onValueChange,
  result,
  onResult,
  compact = false,
  label = "Kupon kodunuz var mı?",
}: {
  plan: EsnafPlanSlug;
  period: BillingPeriod;
  value: string;
  onValueChange: (v: string) => void;
  result: CouponResult | null;
  onResult: (r: CouponResult | null) => void;
  compact?: boolean;
  label?: string;
}) {
  const [checking, setChecking] = useState(false);
  const id = compact ? "kupon-form" : "kupon";

  async function check() {
    if (!value.trim()) {
      onResult(null);
      return;
    }
    setChecking(true);
    const r = await validateCoupon(value, plan, period);
    setChecking(false);
    onResult(r);
  }

  return (
    <div className={cn(!compact && "rounded-lg border border-brand-amber/40 bg-brand-amber-soft p-5 sm:p-6")}>
      <Field id={id} label={label} hint={compact ? undefined : "Magnet üstündeki ya da temsilcinizin verdiği kodu yazın."}>
        <div className="flex gap-2">
          <Input
            id={id}
            value={value}
            onChange={(e) => {
              onValueChange(e.target.value);
              if (result) onResult(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void check();
              }
            }}
            placeholder="Örn. MAGNET100"
            autoCapitalize="characters"
            autoComplete="off"
            className={cn(fieldInputClass, "font-plex-mono uppercase")}
          />
          <button
            type="button"
            onClick={() => void check()}
            disabled={checking || !value.trim()}
            className="shrink-0 rounded-md bg-brand-navy px-4 py-3 text-sm font-semibold text-white hover:bg-[#0E2039] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {checking ? "Kontrol ediliyor" : "Uygula"}
          </button>
        </div>
      </Field>
      {result ? (
        <p className={cn("mt-3 text-sm leading-relaxed", result.valid ? "text-brand-green" : "text-red-700")} role="status">
          {result.message}
          {result.valid ? (
            <>
              {" "}
              Liste fiyatı {formatTry(result.listPrice)}, kuponlu fiyat{" "}
              <span className="font-plex-mono font-semibold">{formatTry(result.finalPrice)}</span> (KDV hariç).
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
