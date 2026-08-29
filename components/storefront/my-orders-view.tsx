"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Bell, ChevronRight, History, PackageSearch, Phone, Radar } from "lucide-react";
import { StorefrontSubpageShell } from "@/components/storefront/storefront-subpage-shell";
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
import { clearTrackingPhone, markSeen, readTrackingPhone, saveTrackingPhone } from "@/lib/storefront/tracking-phone";

interface OrderRow {
  id: string;
  order_no: number | null;
  order_number: string;
  created_at: string;
  status: OrderStatus;
  status_updated_at: string;
  currency: string;
  total_amount: number;
  item_count: number;
  preview: string[];
  tracking_token: string | null;
}


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

function MyOrdersCard({ subdomain, tenantName, logoUrl, isTekel }: { subdomain: string; tenantName: string; logoUrl: string | null; isTekel: boolean }) {
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
      saveTrackingPhone(raw);
      // Listeyi gören müşteri güncellemeleri görmüş sayılır → başlık rozeti söner.
      markSeen(d.orders.map((o) => ({ orderNo: o.order_no, statusUpdatedAt: o.status_updated_at })));
    } catch {
      setError(t("orders.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = readTrackingPhone();
    if (saved) {
      setPhone(saved);
      void lookup(saved);
    }
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
    clearTrackingPhone();
  };

  const text = theme.text;
  const muted = theme.textMuted;
  const active = (orders ?? []).filter((o) => o.status !== "delivered" && o.status !== "cancelled");
  const past = (orders ?? []).filter((o) => o.status === "delivered" || o.status === "cancelled");

  const renderOrder = (o: OrderRow) => {
    const inner = (
      <>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={cn("text-base font-semibold", text)}>{displayNo(o)}</p>
            <p className={cn("mt-0.5 text-xs", muted)}>{fmtDate(o.created_at)}</p>
          </div>
          <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold", theme.border, text)}>
            <span className={cn("size-2 rounded-full", STATUS_DOT[o.status])} />
            {getStatusLabel(o.status, { isTekel })}
          </span>
        </div>
        <p className={cn("mt-3 line-clamp-2 text-sm", muted)}>
          {o.preview.length ? `${o.preview.join(", ")}${o.item_count > o.preview.length ? "…" : ""}` : `${o.item_count} ${t("orders.items")}`}
        </p>
        <div className={cn("mt-3 flex items-center justify-between gap-3 border-t pt-3", theme.border)}>
          <span className={cn("text-xs", muted)}>{o.item_count} {t("orders.items")}</span>
          <span className="flex items-center gap-2">
            <span className={cn("text-sm font-bold tabular-nums", o.status === "cancelled" ? cn("line-through", muted) : text)}>
              {o.currency === "CATALOG" ? "—" : formatCurrency(o.total_amount, o.currency as CurrencyCode)}
            </span>
            {o.tracking_token ? <ChevronRight className={cn("size-4", muted)} /> : null}
          </span>
        </div>
      </>
    );
    const cls = cn("block rounded-2xl border p-4 transition", theme.border, theme.surface, o.tracking_token && "hover:-translate-y-0.5 hover:shadow-md");
    return o.tracking_token ? (
      <a key={o.id} href={`/siparis/${o.tracking_token}`} className={cls} title={t("orders.detail")}>{inner}</a>
    ) : (
      <div key={o.id} className={cls}>{inner}</div>
    );
  };

  const features = [
    { icon: Radar, label: t("orders.feature1") },
    { icon: Bell, label: t("orders.feature2") },
    { icon: History, label: t("orders.feature3") },
  ];

  return (
    <StorefrontSubpageShell logoUrl={logoUrl} title={tenantName}>
      {orders === null ? (
        <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <p className={cn("text-xs font-semibold uppercase tracking-[0.22em]", muted)}>{t("orders.eyebrow")}</p>
            <h1 className={cn("mt-3 text-3xl font-semibold leading-tight sm:text-4xl", text)} style={{ textWrap: "balance" }}>
              {t("orders.heroTitle")}
            </h1>
            <p className={cn("mt-4 max-w-md text-base leading-7", muted)}>{t("orders.intro")}</p>
            <ul className="mt-8 space-y-4">
              {features.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-start gap-3">
                  <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl border", theme.border, theme.surface)}>
                    <Icon className={cn("size-4", text)} />
                  </span>
                  <span className={cn("pt-1.5 text-sm leading-6", text)}>{label}</span>
                </li>
              ))}
            </ul>
          </div>
          <form onSubmit={onSubmit} className={cn(theme.gateCard, "w-full space-y-4")}>
            <div className="flex items-center gap-3">
              <span className={cn("flex size-11 items-center justify-center rounded-2xl border", theme.border, theme.surface)}>
                <PackageSearch className={cn("size-5", text)} />
              </span>
              <div>
                <p className={cn("text-base font-semibold", text)}>{t("orders.title")}</p>
                <p className={cn("text-xs", muted)}>{t("orders.showingFor").replace(/:?$/, "")}</p>
              </div>
            </div>
            <label className={cn("flex items-center gap-2 rounded-xl border px-3 py-3", theme.border, theme.surface)}>
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
            <button type="submit" disabled={loading} className={cn(theme.primaryButton, "h-12 w-full justify-center text-base disabled:opacity-60")}>
              {loading ? t("orders.loading") : t("orders.submit")}
            </button>
          </form>
        </section>
      ) : (
        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className={cn("text-xs font-semibold uppercase tracking-[0.22em]", muted)}>{t("orders.eyebrow")}</p>
              <h1 className={cn("mt-2 text-2xl font-semibold sm:text-3xl", text)}>{t("orders.title")}</h1>
              <p className={cn("mt-1 text-sm", muted)}>
                {t("orders.showingFor")}: <span className={cn("font-semibold", text)}>{activePhone}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={reset}
              className={cn("inline-flex h-10 items-center rounded-full border px-4 text-xs font-semibold transition hover:opacity-80", theme.border, text)}
            >
              {t("orders.changePhone")}
            </button>
          </div>

          {orders.length === 0 ? (
            <div className={cn("mt-8 rounded-2xl border px-6 py-12 text-center", theme.border, theme.surface)}>
              <PackageSearch className={cn("mx-auto size-8", muted)} />
              <p className={cn("mt-3 text-sm font-semibold", text)}>{t("orders.noPastOrders")}</p>
              <p className={cn("mt-1 text-sm", muted)}>{t("orders.notFound")}</p>
            </div>
          ) : null}

          {active.length ? (
            <div className="mt-8">
              <h2 className={cn("text-xs font-semibold uppercase tracking-wide", muted)}>{t("orders.active")} · {active.length}</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">{active.map(renderOrder)}</div>
            </div>
          ) : null}
          {past.length ? (
            <div className="mt-10">
              <h2 className={cn("text-xs font-semibold uppercase tracking-wide", muted)}>{t("orders.past")} · {past.length}</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">{past.map(renderOrder)}</div>
            </div>
          ) : null}
        </section>
      )}
    </StorefrontSubpageShell>
  );
}

export function MyOrdersView(props: {
  subdomain: string;
  tenantName: string;
  logoUrl: string | null;
  isTekel: boolean;
  appearance?: StorefrontAppearanceSettings;
}) {
  return (
    <StorefrontThemeProvider
      themeKey={props.appearance?.theme_key ?? "minimal"}
      brandPrimaryColor={props.appearance?.brand_primary_color}
      brandAccentColor={props.appearance?.brand_accent_color}
    >
      <MyOrdersCard subdomain={props.subdomain} tenantName={props.tenantName} logoUrl={props.logoUrl} isTekel={props.isTekel} />
    </StorefrontThemeProvider>
  );
}
