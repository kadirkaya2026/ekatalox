"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Bell, ChevronRight, History, LogOut, PackageSearch, Phone, Radar, UserRound } from "lucide-react";
import { useStoreMember, type StoreMemberProfile } from "@/components/storefront/member-auth";
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
import {
  clearTrackingPhone,
  markSeen,
  readGuestOrderTokens,
  readTrackingPhone,
  saveTrackingPhone,
} from "@/lib/storefront/tracking-phone";

export interface OrderRow {
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

function OrderCard({ o, isTekel }: { o: OrderRow; isTekel: boolean }) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();
  const text = theme.text;
  const muted = theme.textMuted;
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
    <a href={`/siparis/${o.tracking_token}`} className={cls} title={t("orders.detail")}>{inner}</a>
  ) : (
    <div className={cls}>{inner}</div>
  );
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

  const renderOrder = (o: OrderRow) => <OrderCard key={o.id} o={o} isTekel={isTekel} />;

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
                <p className={cn("text-xs", muted)}>{t("orders.formHint")}</p>
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

export function OrderSections({ orders, isTekel }: { orders: OrderRow[]; isTekel: boolean }) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();
  const active = orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled");
  const past = orders.filter((o) => o.status === "delivered" || o.status === "cancelled");
  if (!orders.length) {
    return (
      <div className={cn("mt-8 rounded-2xl border px-6 py-12 text-center", theme.border, theme.surface)}>
        <PackageSearch className={cn("mx-auto size-8", theme.textMuted)} />
        <p className={cn("mt-3 text-sm font-semibold", theme.text)}>{t("orders.noPastOrders")}</p>
      </div>
    );
  }
  return (
    <>
      {active.length ? (
        <div className="mt-8">
          <h2 className={cn("text-xs font-semibold uppercase tracking-wide", theme.textMuted)}>{t("orders.active")} · {active.length}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">{active.map((o) => <OrderCard key={o.id} o={o} isTekel={isTekel} />)}</div>
        </div>
      ) : null}
      {past.length ? (
        <div className="mt-10">
          <h2 className={cn("text-xs font-semibold uppercase tracking-wide", theme.textMuted)}>{t("orders.past")} · {past.length}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">{past.map((o) => <OrderCard key={o.id} o={o} isTekel={isTekel} />)}</div>
        </div>
      ) : null}
    </>
  );
}

function MemberInfoForm({ subdomain, member, onSaved }: { subdomain: string; member: StoreMemberProfile; onSaved: (m: StoreMemberProfile) => void }) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();
  const [fullName, setFullName] = useState(member.full_name);
  const [address, setAddress] = useState(member.address);
  const [email, setEmail] = useState(member.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setPending(true);
    setMsg(null);
    try {
      const r = await fetch("/api/storefront/member", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subdomain,
          full_name: fullName,
          address,
          email: email || null,
          ...(newPassword ? { current_password: currentPassword, new_password: newPassword } : {}),
        }),
      });
      const d = (await r.json().catch(() => null)) as { member?: StoreMemberProfile; error?: string } | null;
      if (!r.ok || !d?.member) {
        setMsg({ ok: false, text: d?.error ?? t("member.error") });
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setMsg({ ok: true, text: t("member.saved") });
      onSaved(d.member);
    } catch {
      setMsg({ ok: false, text: t("member.error") });
    } finally {
      setPending(false);
    }
  };

  const field = cn("w-full rounded-xl border px-3 py-2.5 text-[16px] outline-none", theme.border, theme.surface, theme.text);
  const label = cn("mb-1 block text-xs font-semibold", theme.textMuted);
  return (
    <form onSubmit={submit} className={cn("mt-4 grid gap-3 rounded-2xl border p-4 sm:grid-cols-2", theme.border, theme.surface)}>
      <label>
        <span className={label}>{t("member.fullName")}</span>
        <input className={field} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      </label>
      <label>
        <span className={label}>{t("member.emailOptional")}</span>
        <input type="email" className={field} value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="sm:col-span-2">
        <span className={label}>{t("member.address")}</span>
        <textarea rows={2} className={cn(field, "resize-none")} value={address} onChange={(e) => setAddress(e.target.value)} />
      </label>
      <p className={cn("text-xs font-semibold sm:col-span-2", theme.text)}>{t("member.changePassword")}</p>
      <label>
        <span className={label}>{t("member.currentPassword")}</span>
        <input type="password" autoComplete="current-password" className={field} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
      </label>
      <label>
        <span className={label}>{t("member.newPassword")}</span>
        <input type="password" autoComplete="new-password" minLength={6} className={field} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
      </label>
      <div className="flex items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={pending} className={cn(theme.primaryButton, "h-11 justify-center px-6 text-sm disabled:opacity-60")}>
          {pending ? t("member.wait") : t("member.save")}
        </button>
        {msg ? <span className={cn("text-sm", msg.ok ? theme.text : theme.dangerText)}>{msg.text}</span> : null}
      </div>
    </form>
  );
}

// Market/tekel (0180): numarayla sorgu yok. Üye → hesabındaki siparişler +
// bilgilerim; üyeliksiz → giriş/üye ol formu + bu cihazdan verilen siparişler.
function MemberOrdersCard({
  subdomain,
  tenantName,
  logoUrl,
  isTekel,
  resetToken,
}: {
  subdomain: string;
  tenantName: string;
  logoUrl: string | null;
  isTekel: boolean;
  resetToken: string | null;
}) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();
  const { member, loaded, setMember, logout } = useStoreMember(subdomain);
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [pendingReset] = useState(resetToken);

  useEffect(() => {
    if (!loaded) return;
    let cancelled = false;
    const tokens = readGuestOrderTokens();
    if (!member && !tokens.length) {
      const timer = window.setTimeout(() => setOrders([]), 0);
      return () => window.clearTimeout(timer);
    }
    void (async () => {
      try {
        const r = await fetch("/api/storefront/my-orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subdomain, tokens }),
        });
        const d = (await r.json().catch(() => null)) as { orders?: OrderRow[] } | null;
        if (cancelled) return;
        const list = d?.orders ?? [];
        setOrders(list);
        markSeen(list.map((o) => ({ orderNo: o.order_no, statusUpdatedAt: o.status_updated_at })));
      } catch {
        if (!cancelled) setOrders([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loaded, member, subdomain]);



  const text = theme.text;
  const muted = theme.textMuted;

  if (!loaded) {
    return (
      <StorefrontSubpageShell logoUrl={logoUrl} title={tenantName}>
        <p className={cn("py-16 text-center text-sm", muted)}>{t("orders.loading")}</p>
      </StorefrontSubpageShell>
    );
  }

  if (member && !pendingReset) {
    return (
      <StorefrontSubpageShell logoUrl={logoUrl} title={tenantName}>
        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className={cn("text-xs font-semibold uppercase tracking-[0.22em]", muted)}>{t("orders.eyebrow")}</p>
              <h1 className={cn("mt-2 text-2xl font-semibold sm:text-3xl", text)}>
                {t("member.hello")}
                {member.full_name ? `, ${member.full_name.split(" ")[0]}` : ""}
              </h1>
              <p className={cn("mt-1 text-sm", muted)}>{member.phone}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowInfo((v) => !v)}
                className={cn("inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-xs font-semibold transition hover:opacity-80", theme.border, text)}
              >
                <UserRound className="size-4" />
                {t("member.myInfo")}
              </button>
              <button
                type="button"
                onClick={() => void logout()}
                className={cn("inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-xs font-semibold transition hover:opacity-80", theme.border, text)}
              >
                <LogOut className="size-4" />
                {t("member.logout")}
              </button>
            </div>
          </div>
          {showInfo ? <MemberInfoForm subdomain={subdomain} member={member} onSaved={(m) => setMember(m)} /> : null}
          {orders === null ? (
            <p className={cn("mt-8 text-sm", muted)}>{t("orders.loading")}</p>
          ) : (
            <OrderSections orders={orders} isTekel={isTekel} />
          )}
        </section>
      </StorefrontSubpageShell>
    );
  }

  return (
    <StorefrontSubpageShell logoUrl={logoUrl} title={tenantName}>
      <section className="grid items-start gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div>
          <p className={cn("text-xs font-semibold uppercase tracking-[0.22em]", muted)}>{t("orders.eyebrow")}</p>
          <h1 className={cn("mt-3 text-3xl font-semibold leading-tight sm:text-4xl", text)} style={{ textWrap: "balance" }}>
            {t("member.ordersHeroTitle")}
          </h1>
          <p className={cn("mt-4 max-w-md text-base leading-7", muted)}>{t("member.ordersIntro")}</p>
          <ul className="mt-8 space-y-4">
            {[
              { icon: Radar, label: t("orders.feature1") },
              { icon: Bell, label: t("orders.feature2") },
              { icon: History, label: t("orders.feature3") },
            ].map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-start gap-3">
                <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl border", theme.border, theme.surface)}>
                  <Icon className={cn("size-4", text)} />
                </span>
                <span className={cn("pt-1.5 text-sm leading-6", text)}>{label}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className={cn(theme.gateCard, "w-full space-y-3")}>
          <a href="/giris?next=/hesabim/siparisler" className={cn(theme.primaryButton, "h-12 w-full justify-center text-base")}>
            {t("member.login")}
          </a>
          <a
            href="/uye-ol?next=/hesabim/siparisler"
            className={cn("flex h-12 w-full items-center justify-center rounded-xl border text-base font-semibold", theme.border, text)}
          >
            {t("member.register")}
          </a>
        </div>
      </section>
    </StorefrontSubpageShell>
  );
}

export function MyOrdersView(props: {
  subdomain: string;
  tenantName: string;
  logoUrl: string | null;
  isTekel: boolean;
  /** Market/tekel üyeliği (0180): numara yerine giriş/üye ol. */
  membership?: boolean;
  /** E-postadaki şifre yenileme bağlantısının kodu (?sifirla=). */
  resetToken?: string | null;
  appearance?: StorefrontAppearanceSettings;
}) {
  return (
    <StorefrontThemeProvider
      themeKey={props.appearance?.theme_key ?? "minimal"}
      brandPrimaryColor={props.appearance?.brand_primary_color}
      brandAccentColor={props.appearance?.brand_accent_color}
      brandPalette={props.appearance?.brand_palette}
    >
      {props.membership ? (
        <MemberOrdersCard
          subdomain={props.subdomain}
          tenantName={props.tenantName}
          logoUrl={props.logoUrl}
          isTekel={props.isTekel}
          resetToken={props.resetToken ?? null}
        />
      ) : (
        <MyOrdersCard subdomain={props.subdomain} tenantName={props.tenantName} logoUrl={props.logoUrl} isTekel={props.isTekel} />
      )}
    </StorefrontThemeProvider>
  );
}
