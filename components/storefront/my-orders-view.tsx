"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, ChevronRight, PackageSearch, Phone } from "lucide-react";
import {
  StorefrontThemeProvider,
  useStorefrontTheme,
  type StorefrontAppearanceSettings,
} from "@/lib/storefront/theme-context";
import { useStorefrontLocale } from "@/lib/storefront/locale-context";
import { cn, formatCurrency } from "@/lib/utils";
import type { CurrencyCode } from "@/lib/products/constants";
import type { OrderStatus } from "@/lib/types";
import { getStatusLabel } from "@/lib/orders/status";
import { normalizeCustomerPhone } from "@/lib/storefront/customer-phone";

interface OrderRow {
  id: string;
  order_no: number | null;
  order_number: string;
  created_at: string;
  status: OrderStatus;
  currency: string;
  total_amount: number;
  item_count: number;
  preview: string[];
  tracking_token: string | null;
}

// Aynı cihazdan bir daha girmesin diye numara tarayıcıda tutulur (yalnız bu
// vitrin için). Kişisel veri sunucuya gitmez; müşteri "Başka numara" ile siler.
const STORAGE_KEY = "ekx-track-phone";

const STATUS_DOT: Record<OrderStatus, string> = {
  new: "bg-amber-400",
  confirmed: "bg-sky-400",
  preparing: "bg-indigo-400",
  shipped: "bg-violet-400",
  delivered: "bg-emerald-500",
  cancelled: "bg-rose-500",
};

function displayNo(o: Pick<OrderRow, "order_no" | "order_number">) {
  if (typeof o.order_no === "number") return `#${o.order_no}`;
  const parts = o.order_number.split("_");
  return `#${(parts[parts.length - 1] ?? o.order_number).toUpperCase()}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function MyOrdersCard({ subdomain, tenantName, isTekel }: { subdomain: string; tenantName: string; isTekel: boolean }) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();
  const [phone, setPhone] = useState("");
  const [activePhone, setActivePhone] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = async (raw: string) => {
    const digits = normalizeCustomerPhone(raw);
    if (digits.length < 10) {
      setError(t("orders.invalidPhone"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/storefront/my-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subdomain, phone: digits }),
      });
      if (!r.ok) {
        setError(r.status === 400 ? t("orders.invalidPhone") : t("orders.error"));
        return;
      }
      const d = (await r.json()) as { orders: OrderRow[] };
      setOrders(d.orders);
      setActivePhone(raw);
      try { window.localStorage.setItem(STORAGE_KEY, raw); } catch { /* özel pencere */ }
    } catch {
      setError(t("orders.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setPhone(saved);
        void lookup(saved);
      }
    } catch { /* depolama kapalı */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void lookup(phone);
  };

  const reset = () => {
    setOrders(null);
    setActivePhone(null);
    setPhone("");
    setError(null);
    try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* yok say */ }
  };

  const text = theme.text;
  const muted = theme.textMuted;
  const active = (orders ?? []).filter((o) => o.status !== "delivered" && o.status !== "cancelled");
  const past = (orders ?? []).filter((o) => o.status === "delivered" || o.status === "cancelled");

  const renderOrder = (o: OrderRow) => {
    const inner = (
      <>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className={cn("text-sm font-semibold", text)}>{displayNo(o)}</span>
            <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", text)}>
              <span className={cn("size-2 rounded-full", STATUS_DOT[o.status])} />
              {getStatusLabel(o.status, { isTekel })}
            </span>
          </div>
          <p className={cn("mt-0.5 text-xs", muted)}>
            {fmtDate(o.created_at)} · {o.item_count} {t("orders.items")}
            {o.preview.length ? ` · ${o.preview.join(", ")}${o.item_count > o.preview.length ? "…" : ""}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={cn("text-sm font-semibold tabular-nums", o.status === "cancelled" ? cn("line-through", muted) : text)}>
            {o.currency === "CATALOG" ? "—" : formatCurrency(o.total_amount, o.currency as CurrencyCode)}
          </span>
          {o.tracking_token ? <ChevronRight className={cn("size-4", muted)} /> : null}
        </div>
      </>
    );
    const cls = cn("flex items-center gap-3 rounded-xl border px-3 py-3 transition", theme.border, theme.surface, o.tracking_token && "hover:opacity-90");
    return o.tracking_token ? (
      <a key={o.id} href={`/siparis/${o.tracking_token}`} className={cls} title={t("orders.detail")}>{inner}</a>
    ) : (
      <div key={o.id} className={cls}>{inner}</div>
    );
  };

  return (
    <div data-storefront className="container-shell flex min-h-screen items-start justify-center py-6">
      <div className={cn(theme.gateCard, "w-full max-w-lg")}>
        <a href="/" className={cn("inline-flex items-center gap-1 text-xs font-medium", muted)}>
          <ArrowLeft className="size-3.5" /> {tenantName}
        </a>
        <h1 className={cn("mt-2 flex items-center gap-2 text-2xl font-semibold", text)}>
          <PackageSearch className="size-6" /> {t("orders.title")}
        </h1>

        {orders === null ? (
          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <p className={cn("text-sm", muted)}>{t("orders.intro")}</p>
            <label className={cn("flex items-center gap-2 rounded-xl border px-3 py-2.5", theme.border, theme.surface)}>
              <Phone className={cn("size-4 shrink-0", muted)} />
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("orders.phonePlaceholder")}
                className={cn("w-full bg-transparent text-base outline-none placeholder:opacity-50", text)}
                autoFocus
              />
            </label>
            {error ? <p className={theme.gateError}>{error}</p> : null}
            <button type="submit" disabled={loading} className={cn(theme.primaryButton, "w-full justify-center disabled:opacity-60")}>
              {loading ? t("orders.loading") : t("orders.submit")}
            </button>
          </form>
        ) : (
          <div className="mt-4 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className={cn("text-xs", muted)}>{t("orders.showingFor")}: <span className={cn("font-semibold", text)}>{activePhone}</span></p>
              <button type="button" onClick={reset} className={cn("text-xs font-semibold underline-offset-2 hover:underline", text)}>
                {t("orders.changePhone")}
              </button>
            </div>
            {orders.length === 0 ? (
              <p className={cn("rounded-xl border px-3 py-4 text-center text-sm", theme.border, muted)}>{t("orders.notFound")}</p>
            ) : null}
            {active.length ? (
              <section className="space-y-2">
                <h2 className={cn("text-xs font-semibold uppercase tracking-wide", muted)}>{t("orders.active")}</h2>
                {active.map(renderOrder)}
              </section>
            ) : null}
            {past.length ? (
              <section className="space-y-2">
                <h2 className={cn("text-xs font-semibold uppercase tracking-wide", muted)}>{t("orders.past")}</h2>
                {past.map(renderOrder)}
              </section>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

export function MyOrdersView(props: {
  subdomain: string;
  tenantName: string;
  isTekel: boolean;
  appearance?: StorefrontAppearanceSettings;
}) {
  return (
    <StorefrontThemeProvider
      themeKey={props.appearance?.theme_key ?? "minimal"}
      brandPrimaryColor={props.appearance?.brand_primary_color}
      brandAccentColor={props.appearance?.brand_accent_color}
    >
      <MyOrdersCard subdomain={props.subdomain} tenantName={props.tenantName} isTekel={props.isTekel} />
    </StorefrontThemeProvider>
  );
}
