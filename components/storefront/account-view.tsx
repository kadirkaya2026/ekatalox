"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Check, FileText, Loader2, MapPin, Package, Pencil, RotateCcw, Star, Trash2, UserRound } from "lucide-react";
import { StorefrontSubpageShell } from "@/components/storefront/storefront-subpage-shell";
import { formatDealerAddress, PRIMARY_DEALER_ADDRESS_ID, type DealerAddress } from "@/lib/kurumsal/dealer-profile";
import { getStatusLabel } from "@/lib/orders/status";
import type { CurrencyCode } from "@/lib/products/constants";
import {
  StorefrontThemeProvider,
  useStorefrontTheme,
  type StorefrontAppearanceSettings,
} from "@/lib/storefront/theme-context";
import type { OrderStatus } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

// Vitrin "Hesabım" (8 Eki 2026, önce Lucatech). Kişiye özel bayi şifresiyle
// giren müşteri: siparişlerim (fiş, tekrar sipariş), bilgilerim, adreslerim.
// Buradaki bilgiler panelde Müşteriler sayfasındaki kaydın aynısıdır.

type AccountOrder = {
  id: string;
  order_no: number | null;
  order_number: string;
  status: OrderStatus;
  created_at: string;
  currency: string;
  total_amount: number;
  item_count: number;
  tracking_token: string | null;
  preview: Array<{ name: string; quantity: number }>;
};

type AccountProfile = { company: string | null; name: string | null; phone: string | null };

type AccountData = { profile: AccountProfile; addresses: DealerAddress[]; orders: AccountOrder[] };

type Tab = "orders" | "info" | "addresses";

const STATUS_DOT: Record<OrderStatus, string> = {
  new: "bg-amber-400",
  confirmed: "bg-sky-400",
  preparing: "bg-indigo-400",
  shipped: "bg-violet-400",
  delivered: "bg-emerald-500",
  cancelled: "bg-rose-500",
};

function displayNo(order: Pick<AccountOrder, "order_no" | "order_number">) {
  if (typeof order.order_no === "number") return `#${order.order_no}`;
  const parts = order.order_number.split("_");
  return `#${(parts[parts.length - 1] ?? order.order_number).toUpperCase()}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function AccountCard({ subdomain, tenantName, logoUrl }: { subdomain: string; tenantName: string; logoUrl: string | null }) {
  const theme = useStorefrontTheme();
  const text = theme.text;
  const muted = theme.textMuted;
  const [tab, setTab] = useState<Tab>("orders");
  const [data, setData] = useState<AccountData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const initial = window.location.hash.replace("#", "");
    const timer = window.setTimeout(() => {
      if (initial === "bilgilerim") setTab("info");
      if (initial === "adreslerim") setTab("addresses");
    }, 0);
    fetch(`/api/storefront/account?${new URLSearchParams({ subdomain })}`)
      .then(async (response) => {
        const json = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(typeof json.error === "string" ? json.error : "Hesap bilgileri alınamadı.");
        setData(json as AccountData);
      })
      .catch((error: Error) => setLoadError(error.message));
    return () => window.clearTimeout(timer);
  }, [subdomain]);

  function selectTab(next: Tab) {
    setTab(next);
    const hash = next === "info" ? "#bilgilerim" : next === "addresses" ? "#adreslerim" : "";
    window.history.replaceState(window.history.state, "", window.location.pathname + hash);
  }

  const tabs: Array<{ key: Tab; label: string; icon: typeof Package }> = [
    { key: "orders", label: "Siparişlerim", icon: Package },
    { key: "info", label: "Bilgilerim", icon: UserRound },
    { key: "addresses", label: "Adreslerim", icon: MapPin },
  ];
  const firstName = data?.profile.name?.trim().split(/\s+/)[0];

  return (
    <StorefrontSubpageShell logoUrl={logoUrl} title={tenantName} maxWidthClassName="max-w-4xl">
      <section>
        <p className={cn("text-xs font-semibold uppercase tracking-[0.22em]", muted)}>Hesabım</p>
        <h1 className={cn("mt-2 text-2xl font-semibold sm:text-3xl", text)}>
          {firstName ? `Merhaba, ${firstName}` : "Hesabım"}
        </h1>
        {data?.profile.company ? <p className={cn("mt-1 text-sm", muted)}>{data.profile.company}</p> : null}

        <div className={cn("mt-6 grid grid-cols-3 gap-1 rounded-2xl border p-1", theme.border, theme.surface)} role="tablist">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => selectTab(key)}
              className={cn(
                "inline-flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-1.5 py-2.5 text-[13px] font-semibold transition sm:gap-2 sm:px-3 sm:text-sm",
                tab === key ? cn(theme.activeTileBg, theme.activeTileText) : cn(muted, "hover:opacity-80"),
              )}
            >
              <Icon className="hidden size-4 shrink-0 sm:block" /> {label}
            </button>
          ))}
        </div>

        {loadError ? (
          <div className={cn("mt-6 rounded-2xl border px-6 py-10 text-center text-sm", theme.border, theme.surface, text)}>
            {loadError}
          </div>
        ) : !data ? (
          <div className={cn("mt-10 flex justify-center", muted)}>
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : tab === "orders" ? (
          <OrdersTab subdomain={subdomain} orders={data.orders} />
        ) : tab === "info" ? (
          <InfoTab subdomain={subdomain} profile={data.profile} onSaved={(profile) => setData({ ...data, profile })} />
        ) : (
          <AddressesTab
            subdomain={subdomain}
            addresses={data.addresses}
            onChange={(addresses) => setData({ ...data, addresses })}
          />
        )}
      </section>
    </StorefrontSubpageShell>
  );
}

function OrdersTab({ subdomain, orders }: { subdomain: string; orders: AccountOrder[] }) {
  const theme = useStorefrontTheme();
  const text = theme.text;
  const muted = theme.textMuted;
  const secondaryButton = cn(
    "inline-flex h-10 items-center justify-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition hover:opacity-80",
    theme.border,
    text,
  );

  if (!orders.length) {
    return (
      <div className={cn("mt-6 rounded-2xl border px-6 py-12 text-center", theme.border, theme.surface)}>
        <Package className={cn("mx-auto size-8", muted)} />
        <p className={cn("mt-3 text-sm font-semibold", text)}>Henüz siparişiniz yok</p>
        <p className={cn("mt-1 text-sm", muted)}>Verdiğiniz siparişler burada listelenir.</p>
        {/* Vitrin özel alan adında da çalışsın diye tam sayfa geçiş (subpage shell ile aynı). */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className={cn("rounded-full font-semibold transition hover:opacity-90", theme.activeTileBg, theme.activeTileText, "mt-5 inline-flex h-11 items-center justify-center px-5 text-sm")}>
          Ürünlere göz at
        </a>
      </div>
    );
  }

  return (
    <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-3">
      {orders.map((order) => {
        const extra = order.item_count - order.preview.length;
        return (
          <article key={order.id} className={cn("rounded-2xl border p-4 sm:p-5", theme.border, theme.surface)}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className={cn("text-base font-semibold", text)}>Sipariş {displayNo(order)}</p>
                <p className={cn("text-xs", muted)}>{fmtDate(order.created_at)}</p>
              </div>
              <div className="text-right">
                <p className={cn("text-base font-semibold tabular-nums", text)}>
                  {formatCurrency(order.total_amount, order.currency as CurrencyCode)}
                </p>
                <p className={cn("mt-0.5 inline-flex items-center gap-1.5 text-xs font-semibold", text)}>
                  <span className={cn("size-2 rounded-full", STATUS_DOT[order.status] ?? "bg-slate-400")} />
                  {getStatusLabel(order.status)}
                </p>
              </div>
            </div>

            <ul className={cn("mt-3 space-y-1 border-t pt-3 text-sm", theme.border, muted)}>
              {order.preview.map((line, index) => (
                <li key={`${line.name}-${index}`} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate">{line.name}</span>
                  <span className="shrink-0 tabular-nums">× {line.quantity}</span>
                </li>
              ))}
              {extra > 0 ? <li className="text-xs">+ {extra} ürün daha</li> : null}
            </ul>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <a
                href={`/?tekrar=${order.id}`}
                className={cn("rounded-full font-semibold transition hover:opacity-90", theme.activeTileBg, theme.activeTileText, "col-span-2 inline-flex h-11 items-center justify-center gap-1.5 px-4 text-sm sm:h-10")}
              >
                <RotateCcw className="size-4" /> Tekrar sipariş ver
              </a>
              <a
                href={`/api/storefront/account/orders/${order.id}/pdf?${new URLSearchParams({ subdomain })}`}
                target="_blank"
                rel="noopener"
                className={secondaryButton}
              >
                <FileText className="size-4" /> Fiş
              </a>
              {order.tracking_token ? (
                <a href={`/siparis/${order.tracking_token}`} className={secondaryButton}>
                  Detay
                </a>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  const theme = useStorefrontTheme();
  return (
    <label className="grid gap-1.5">
      <span className={cn("text-xs font-semibold", theme.textMuted)}>{label}</span>
      {children}
    </label>
  );
}

function useInputClass() {
  const theme = useStorefrontTheme();
  return cn("w-full rounded-xl border px-3 py-2.5 text-base outline-none", theme.border, theme.surface, theme.text);
}

function InfoTab({
  subdomain,
  profile,
  onSaved,
}: {
  subdomain: string;
  profile: AccountProfile;
  onSaved: (profile: AccountProfile) => void;
}) {
  const theme = useStorefrontTheme();
  const inputClass = useInputClass();
  const [form, setForm] = useState({
    customer_company: profile.company ?? "",
    customer_name: profile.name ?? "",
    customer_phone: profile.phone ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/storefront/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subdomain, ...form }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage({ ok: false, text: typeof json.error === "string" ? json.error : "Kaydedilemedi." });
        return;
      }
      onSaved(json.profile as AccountProfile);
      setMessage({ ok: true, text: "Bilgileriniz kaydedildi." });
    } catch {
      setMessage({ ok: false, text: "Bağlantı hatası, tekrar deneyin." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={cn("mt-6 grid gap-4 rounded-2xl border p-5 sm:p-6", theme.border, theme.surface)}>
      <Field label="Firma adı">
        <input
          className={inputClass}
          value={form.customer_company}
          maxLength={120}
          onChange={(event) => setForm({ ...form, customer_company: event.target.value })}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ad soyad">
          <input
            className={inputClass}
            value={form.customer_name}
            maxLength={80}
            required
            onChange={(event) => setForm({ ...form, customer_name: event.target.value })}
          />
        </Field>
        <Field label="Telefon">
          <input
            className={inputClass}
            type="tel"
            inputMode="tel"
            value={form.customer_phone}
            maxLength={20}
            required
            onChange={(event) => setForm({ ...form, customer_phone: event.target.value })}
          />
        </Field>
      </div>
      <p className={cn("text-xs", theme.textMuted)}>
        Bu bilgiler sipariş fişlerinize yazılır. Teslimat adreslerinizi Adreslerim sekmesinden yönetebilirsiniz.
      </p>
      {message ? (
        <p className={cn("text-sm font-medium", message.ok ? theme.successText : theme.dangerText)}>{message.text}</p>
      ) : null}
      <div>
        <button type="submit" disabled={saving} className={cn("rounded-full font-semibold transition hover:opacity-90", theme.activeTileBg, theme.activeTileText, "inline-flex h-11 items-center gap-2 px-5 text-sm disabled:opacity-60")}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Kaydet
        </button>
      </div>
    </form>
  );
}

type AddressDraft = { label: string; address: string; city: string };

function AddressesTab({
  subdomain,
  addresses,
  onChange,
}: {
  subdomain: string;
  addresses: DealerAddress[];
  onChange: (addresses: DealerAddress[]) => void;
}) {
  const theme = useStorefrontTheme();
  const text = theme.text;
  const muted = theme.textMuted;
  const inputClass = useInputClass();
  const smallButton = cn("inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold disabled:opacity-50", theme.border);
  // null = form kapalı, "new" = yeni adres, diğer = düzenlenen adresin kimliği.
  const [editing, setEditing] = useState<string | null>(addresses.length ? null : "new");
  const [draft, setDraft] = useState<AddressDraft>({ label: "", address: "", city: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(payload: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/storefront/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subdomain, ...payload }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof json.error === "string" ? json.error : "İşlem yapılamadı.");
        return false;
      }
      onChange(json.addresses as DealerAddress[]);
      return true;
    } catch {
      setError("Bağlantı hatası, tekrar deneyin.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  function startEdit(entry: DealerAddress | null) {
    setError(null);
    setEditing(entry ? entry.id : "new");
    setDraft(entry ? { label: entry.label ?? "", address: entry.address, city: entry.city ?? "" } : { label: "", address: "", city: "" });
  }

  async function saveDraft(event: FormEvent) {
    event.preventDefault();
    const ok = await send(
      editing === "new" ? { action: "add", address: draft } : { action: "update", id: editing, address: draft },
    );
    if (ok) setEditing(null);
  }

  return (
    <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-3">
      {error && !editing ? <p className={cn("text-sm font-medium", theme.dangerText)}>{error}</p> : null}
      {addresses.map((entry) => {
        const isDefault = entry.id === PRIMARY_DEALER_ADDRESS_ID;
        return (
          <article key={entry.id} className={cn("rounded-2xl border p-4 sm:p-5", theme.border, theme.surface)}>
            <p className={cn("flex flex-wrap items-center gap-2 text-sm font-semibold", text)}>
              <MapPin className="size-4 shrink-0" />
              {entry.label ?? (isDefault ? "Varsayılan adres" : "Adres")}
              {isDefault ? (
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", theme.activeTileBg, theme.activeTileText)}>
                  Varsayılan
                </span>
              ) : null}
            </p>
            <p className={cn("mt-1 break-words text-sm", muted)}>{formatDealerAddress(entry)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {!isDefault ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void send({ action: "default", id: entry.id })}
                  className={cn(smallButton, text)}
                >
                  <Star className="size-3.5" /> Varsayılan yap
                </button>
              ) : null}
              <button type="button" disabled={busy} onClick={() => startEdit(entry)} className={cn(smallButton, text)}>
                <Pencil className="size-3.5" /> Düzenle
              </button>
              {addresses.length > 1 ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void send({ action: "delete", id: entry.id })}
                  className={cn(smallButton, theme.dangerText)}
                >
                  <Trash2 className="size-3.5" /> Sil
                </button>
              ) : null}
            </div>
          </article>
        );
      })}

      {editing ? (
        <form onSubmit={saveDraft} className={cn("grid gap-3 rounded-2xl border p-5", theme.border, theme.surface)}>
          <p className={cn("text-sm font-semibold", text)}>{editing === "new" ? "Yeni adres" : "Adresi düzenle"}</p>
          {editing !== PRIMARY_DEALER_ADDRESS_ID ? (
            <Field label="Adres adı (isteğe bağlı)">
              <input
                className={inputClass}
                placeholder="Örn. Depo, Şube 2"
                value={draft.label}
                maxLength={40}
                onChange={(event) => setDraft({ ...draft, label: event.target.value })}
              />
            </Field>
          ) : null}
          <Field label="Açık adres">
            <textarea
              className={inputClass}
              rows={3}
              value={draft.address}
              maxLength={400}
              required
              onChange={(event) => setDraft({ ...draft, address: event.target.value })}
            />
          </Field>
          <Field label="İl / ilçe">
            <input
              className={inputClass}
              value={draft.city}
              maxLength={40}
              onChange={(event) => setDraft({ ...draft, city: event.target.value })}
            />
          </Field>
          {error ? <p className={cn("text-sm font-medium", theme.dangerText)}>{error}</p> : null}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy || draft.address.trim().length < 5}
              className={cn("rounded-full font-semibold transition hover:opacity-90", theme.activeTileBg, theme.activeTileText, "inline-flex h-11 items-center gap-2 px-5 text-sm disabled:opacity-60")}
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Kaydet
            </button>
            {addresses.length ? (
              <button type="button" onClick={() => setEditing(null)} className={cn("h-11 px-4 text-sm font-medium", muted)}>
                Vazgeç
              </button>
            ) : null}
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => startEdit(null)}
          className={cn("rounded-2xl border border-dashed px-4 py-4 text-sm font-semibold transition hover:opacity-80", theme.border, text)}
        >
          + Yeni adres ekle
        </button>
      )}
    </div>
  );
}

export function AccountView(props: {
  subdomain: string;
  tenantName: string;
  logoUrl: string | null;
  appearance?: StorefrontAppearanceSettings;
}) {
  return (
    <StorefrontThemeProvider
      themeKey={props.appearance?.theme_key ?? "minimal"}
      brandPrimaryColor={props.appearance?.brand_primary_color}
      brandAccentColor={props.appearance?.brand_accent_color}
      brandPalette={props.appearance?.brand_palette}
    >
      <AccountCard subdomain={props.subdomain} tenantName={props.tenantName} logoUrl={props.logoUrl} />
    </StorefrontThemeProvider>
  );
}
