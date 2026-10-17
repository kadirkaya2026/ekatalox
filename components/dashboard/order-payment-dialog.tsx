"use client";

import { useState } from "react";
import { Banknote, CreditCard, Globe, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type OrderPaymentEntry = { method: "cash" | "card" | "online"; amount: number };

const METHODS = [
  { key: "cash", label: "Nakit", icon: Banknote },
  { key: "card", label: "Kart", icon: CreditCard },
  { key: "online", label: "Online", icon: Globe },
] as const;

// Siparişi onaylarken alınan ödeme (0187, kullanıcı isteği 17 Eki): isteğe
// bağlı; yöntem seçilmezse sipariş ödemesiz onaylanır. Raporlamada kullanılır.
export function OrderPaymentDialog({
  orderLabel,
  showOnline,
  defaultAmount,
  currencySymbol,
  onClose,
  onConfirm,
}: {
  orderLabel: string;
  /** Mağazada online ödeme açıksa "Online" seçeneği de gösterilir. */
  showOnline: boolean;
  /** Sipariş toplamı; fiyatsız katalogda 0 (tutar elle girilir). */
  defaultAmount: number;
  currencySymbol: string;
  onClose: () => void;
  onConfirm: (payment: OrderPaymentEntry | null) => void;
}) {
  const [method, setMethod] = useState<OrderPaymentEntry["method"] | null>(null);
  const [amount, setAmount] = useState(defaultAmount > 0 ? String(defaultAmount) : "");
  const [error, setError] = useState<string | null>(null);

  function confirmWithPayment() {
    if (!method) {
      setError("Ödeme yöntemini seçin ya da ödemesiz onaylayın.");
      return;
    }
    const value = Number(amount.replace(",", "."));
    if (!Number.isFinite(value) || value <= 0) {
      setError("Alınan tutarı girin.");
      return;
    }
    onConfirm({ method, amount: Math.round(value * 100) / 100 });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="mt-[12vh] w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{orderLabel}</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">Siparişi onayla</h2>
            <p className="mt-1 text-sm text-slate-500">Ödemeyi aldıysanız yöntemini seçin; raporlarda görünür.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100"
            aria-label="Kapat"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className={cn("mt-4 grid gap-2", showOnline ? "grid-cols-3" : "grid-cols-2")}>
          {METHODS.filter((item) => showOnline || item.key !== "online").map((item) => {
            const Icon = item.icon;
            const active = method === item.key;
            return (
              <button
                key={item.key}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setMethod((current) => (current === item.key ? null : item.key));
                  setError(null);
                }}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition",
                  active
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        {method ? (
          <label className="mt-3 block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Alınan tutar ({currencySymbol})</span>
            <Input
              inputMode="decimal"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                setError(null);
              }}
              placeholder="0,00"
            />
          </label>
        ) : null}

        {error ? <p className="mt-2 text-sm font-medium text-red-600">{error}</p> : null}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => onConfirm(null)}>
            Ödemesiz onayla
          </Button>
          <Button type="button" onClick={confirmWithPayment} disabled={!method}>
            Ödeme alındı, onayla
          </Button>
        </div>
      </div>
    </div>
  );
}
