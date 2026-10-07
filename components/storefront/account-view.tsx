"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowLeft,
  CalendarClock,
  Check,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Loader2,
  MapPin,
  Package,
  Pencil,
  Phone,
  Receipt,
  RotateCcw,
  ShoppingBag,
  Star,
  Trash2,
  UserRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { StorefrontImage } from "@/components/storefront/storefront-image";
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
// giren müşteri: genel bakış, siparişlerim (fiş, tekrar sipariş), bilgilerim,
// adreslerim. Bilgiler panelde Müşteriler sayfasındaki kaydın aynısıdır.
// Düzen: masaüstünde solda profil + menü, sağda içerik; mobilde üstte profil
// ve 2x2 menü kutuları (ilk sürümdeki üst sekmeler "boş" bulundu).

type OrderPreviewLine = { name: string; quantity: number; image_url: string | null };

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
  preview: OrderPreviewLine[];
};

type FrequentProduct = {
  id: string;
  name: string;
  sku_code: string | null;
  image_url: string | null;
  price: number | null;
  currency: string;
  is_in_stock: boolean;
  times: number;
  path: string;
};

type AccountProfile = { company: string | null; name: string | null; phone: string | null };

type AccountData = {
  profile: AccountProfile;
  addresses: DealerAddress[];
  orders: AccountOrder[];
  frequent: FrequentProduct[];
  stats: { order_count: number; totals: Array<{ currency: string; amount: number }>; last_order_at: string | null };
};

type Tab = "overview" | "orders" | "info" | "addresses";

const TAB_HASH: Record<Tab, string> = { overview: "", orders: "#siparislerim", info: "#bilgilerim", addresses: "#adreslerim" };

const STATUS_PILL: Record<OrderStatus, string> = {
  new: "bg-amber-100 text-amber-800",
  confirmed: "bg-sky-100 text-sky-800",
  preparing: "bg-indigo-100 text-indigo-800",
  shipped: "bg-violet-100 text-violet-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-800",
};

const PROGRESS_STEPS: Array<{ status: OrderStatus; label: string }> = [
  { status: "new", label: "Alındı" },
  { status: "confirmed", label: "Onaylandı" },
  { status: "preparing", label: "Hazırlanıyor" },
  { status: "shipped", label: "Yola çıktı" },
  { status: "delivered", label: "Teslim edildi" },
];

function displayNo(order: Pick<AccountOrder, "order_no" | "order_number">) {
  if (typeof order.order_no === "number") return `#${order.order_no}`;
  const parts = order.order_number.split("_");
  return `#${(parts[parts.length - 1] ?? order.order_number).toUpperCase()}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function fmtShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
}

function initialsOf(profile: AccountProfile) {
  const source = (profile.company || profile.name || "?").trim();
  const words = source.split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toLocaleUpperCase("tr") || "?";
}

function useButtonClasses() {
  const theme = useStorefrontTheme();
  return {
    primary: cn("inline-flex items-center justify-center gap-1.5 rounded-full font-semibold transition hover:opacity-90", theme.activeTileBg, theme.activeTileText),
    secondary: cn("inline-flex items-center justify-center gap-1.5 rounded-full border font-semibold transition hover:opacity-80", theme.border, theme.surface, theme.text),
  };
}

function AccountCard({ subdomain, tenantName, logoUrl }: { subdomain: string; tenantName: string; logoUrl: string | null }) {
  const theme = useStorefrontTheme();
  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<AccountData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    const initial = (Object.entries(TAB_HASH) as Array<[Tab, string]>).find(([, value]) => value && value === hash)?.[0];
    const timer = window.setTimeout(() => {
      if (initial) setTab(initial);
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
    window.history.replaceState(window.history.state, "", window.location.pathname + TAB_HASH[next]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const menu: Array<{ key: Tab; label: string; hint: string; icon: LucideIcon }> = [
    { key: "overview", label: "Genel bakış", hint: "Özet ve son sipariş", icon: LayoutDashboard },
    { key: "orders", label: "Siparişlerim", hint: data ? `${data.orders.length} sipariş` : "Geçmiş siparişler", icon: Package },
    { key: "addresses", label: "Adreslerim", hint: data ? `${data.addresses.length} kayıtlı adres` : "Teslimat adresleri", icon: MapPin },
    { key: "info", label: "Bilgilerim", hint: "Firma ve iletişim", icon: UserRound },
  ];
  const titles: Record<Tab, { title: string; subtitle: string }> = {
    overview: { title: "Genel bakış", subtitle: "Hesabınızın özeti ve son hareketleriniz." },
    orders: { title: "Siparişlerim", subtitle: "Verdiğiniz tüm siparişler, fişleri ve durumları." },
    addresses: { title: "Adreslerim", subtitle: "Sepette seçebileceğiniz teslimat adresleri." },
    info: { title: "Bilgilerim", subtitle: "Sipariş fişlerinize yazılan firma ve iletişim bilgileri." },
  };

  return (
    <StorefrontSubpageShell logoUrl={logoUrl} title={tenantName} maxWidthClassName="max-w-6xl">
      <div className="grid gap-6 lg:grid-cols-[288px_minmax(0,1fr)] lg:gap-10">
        <aside className="grid content-start gap-4 lg:sticky lg:top-6 lg:self-start">
          <div className={cn("rounded-3xl border p-5", theme.border, theme.surface)}>
            <div className="flex items-center gap-4">
              <span
                className={cn(
                  "flex size-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold tracking-wide",
                  theme.activeTileBg,
                  theme.activeTileText,
                )}
              >
                {data ? initialsOf(data.profile) : ""}
              </span>
              <div className="min-w-0">
                <p className={cn("truncate text-base font-semibold", theme.text)}>
                  {data?.profile.company || data?.profile.name || "Hesabım"}
                </p>
                {data?.profile.company && data.profile.name ? (
                  <p className={cn("truncate text-sm", theme.textMuted)}>{data.profile.name}</p>
                ) : null}
                {data?.profile.phone ? (
                  <p className={cn("mt-0.5 flex items-center gap-1 truncate text-xs", theme.textMuted)}>
                    <Phone className="size-3" /> {data.profile.phone}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <nav className="grid grid-cols-2 gap-2 lg:grid-cols-1 lg:gap-1.5" aria-label="Hesabım menüsü">
            {menu.map(({ key, label, hint, icon: Icon }) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => selectTab(key)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex min-w-0 items-center gap-3 rounded-2xl border p-3 text-left transition",
                    active
                      ? cn("border-transparent", theme.activeTileBg, theme.activeTileText)
                      : cn(theme.border, theme.surface, theme.text, "hover:opacity-90"),
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-xl",
                      active ? "bg-white/15" : theme.surfaceMuted,
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{label}</span>
                    <span className={cn("block truncate text-xs", active ? "opacity-75" : theme.textMuted)}>{hint}</span>
                  </span>
                  <ChevronRight className={cn("hidden size-4 shrink-0 lg:block", active ? "opacity-75" : theme.textMuted)} />
                </button>
              );
            })}
          </nav>

          {/* Vitrin özel alan adında da çalışsın diye tam sayfa geçiş (subpage shell ile aynı). */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" className={cn("hidden items-center gap-2 px-2 text-sm font-semibold lg:inline-flex", theme.textMuted)}>
            <ArrowLeft className="size-4" /> Alışverişe devam et
          </a>
        </aside>

        <main className="min-w-0">
          <h1 className={cn("text-2xl font-semibold sm:text-3xl", theme.text)}>{titles[tab].title}</h1>
          <p className={cn("mt-1 text-sm", theme.textMuted)}>{titles[tab].subtitle}</p>

          {loadError ? (
            <div className={cn("mt-6 rounded-3xl border px-6 py-10 text-center text-sm", theme.border, theme.surface, theme.text)}>
              {loadError}
            </div>
          ) : !data ? (
            <div className={cn("mt-12 flex justify-center", theme.textMuted)}>
              <Loader2 className="size-6 animate-spin" />
            </div>
          ) : tab === "overview" ? (
            <OverviewTab subdomain={subdomain} data={data} onNavigate={selectTab} />
          ) : tab === "orders" ? (
            <OrdersTab subdomain={subdomain} orders={data.orders} />
          ) : tab === "info" ? (
            <InfoTab subdomain={subdomain} profile={data.profile} onSaved={(profile) => setData({ ...data, profile })} />
          ) : (
            <AddressesTab subdomain={subdomain} addresses={data.addresses} onChange={(addresses) => setData({ ...data, addresses })} />
          )}
        </main>
      </div>
    </StorefrontSubpageShell>
  );
}

function Thumb({ src, alt, className }: { src: string | null; alt: string; className?: string }) {
  const theme = useStorefrontTheme();
  return (
    <span className={cn("relative block shrink-0 overflow-hidden rounded-xl border", theme.border, theme.productThumbSurface, className)}>
      {src ? (
        <StorefrontImage src={src} alt={alt} className="object-contain p-1" sizes="96px" />
      ) : (
        <span className={cn("flex size-full items-center justify-center", theme.textMuted)}>
          <Package className="size-4" />
        </span>
      )}
    </span>
  );
}

function StatusPill({ status }: { status: OrderStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", STATUS_PILL[status])}>
      {getStatusLabel(status)}
    </span>
  );
}

function OrderProgress({ status }: { status: OrderStatus }) {
  const theme = useStorefrontTheme();
  if (status === "cancelled") {
    return <p className={cn("text-sm font-medium", theme.dangerText)}>Bu sipariş iptal edildi.</p>;
  }
  const current = PROGRESS_STEPS.findIndex((step) => step.status === status);
  return (
    <ol className="grid grid-cols-5 gap-1.5" aria-label="Sipariş durumu">
      {PROGRESS_STEPS.map((step, index) => {
        const done = index <= current;
        return (
          <li key={step.status} className="min-w-0">
            <span className={cn("block h-1.5 rounded-full", done ? theme.activeTileBg : theme.surfaceMuted)} />
            <span
              className={cn(
                "mt-1.5 block truncate text-[11px] sm:text-xs",
                done ? cn("font-semibold", theme.text) : theme.textMuted,
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function OrderActions({ subdomain, order, compact = false }: { subdomain: string; order: AccountOrder; compact?: boolean }) {
  const buttons = useButtonClasses();
  return (
    <div className={cn("grid grid-cols-2 gap-2 sm:flex sm:flex-wrap", compact && "sm:justify-end")}>
      <a href={`/?tekrar=${order.id}`} className={cn(buttons.primary, "col-span-2 h-11 px-5 text-sm sm:h-10")}>
        <RotateCcw className="size-4" /> Tekrar sipariş ver
      </a>
      <a
        href={`/api/storefront/account/orders/${order.id}/pdf?${new URLSearchParams({ subdomain })}`}
        target="_blank"
        rel="noopener"
        className={cn(buttons.secondary, "h-10 px-4 text-sm")}
      >
        <FileText className="size-4" /> Fiş
      </a>
      {order.tracking_token ? (
        <a href={`/siparis/${order.tracking_token}`} className={cn(buttons.secondary, "h-10 px-4 text-sm")}>
          Detay <ChevronRight className="size-4" />
        </a>
      ) : null}
    </div>
  );
}

function OverviewTab({
  subdomain,
  data,
  onNavigate,
}: {
  subdomain: string;
  data: AccountData;
  onNavigate: (tab: Tab) => void;
}) {
  const theme = useStorefrontTheme();
  const buttons = useButtonClasses();
  const last = data.orders[0];
  const defaultAddress = data.addresses[0];
  const totalLabel = data.stats.totals.length
    ? data.stats.totals.map((entry) => formatCurrency(entry.amount, entry.currency as CurrencyCode)).join(" + ")
    : "—";
  const stats: Array<{ icon: LucideIcon; label: string; value: string }> = [
    { icon: ShoppingBag, label: "Toplam sipariş", value: String(data.stats.order_count) },
    { icon: Wallet, label: "Toplam alışveriş", value: totalLabel },
    { icon: CalendarClock, label: "Son sipariş", value: data.stats.last_order_at ? fmtShortDate(data.stats.last_order_at) : "—" },
  ];

  return (
    <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className={cn("flex min-w-0 flex-col items-start gap-2 rounded-3xl border p-3 sm:flex-row sm:items-center sm:gap-3 sm:p-4 lg:p-5", theme.border, theme.surface)}>
            <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl sm:size-11 sm:rounded-2xl", theme.surfaceMuted, theme.text)}>
              <Icon className="size-5" />
            </span>
            <span className="min-w-0 max-w-full">
              <span className={cn("block truncate text-[11px] font-medium sm:text-xs", theme.textMuted)}>{label}</span>
              <span className={cn("block truncate text-sm font-semibold tabular-nums sm:text-lg lg:text-xl", theme.text)}>{value}</span>
            </span>
          </div>
        ))}
      </div>

      {last ? (
        <section className={cn("rounded-3xl border p-5 sm:p-6", theme.border, theme.surface)}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className={cn("text-xs font-semibold uppercase tracking-wider", theme.textMuted)}>Son siparişiniz</p>
              <p className={cn("mt-1 text-lg font-semibold", theme.text)}>Sipariş {displayNo(last)}</p>
              <p className={cn("text-xs", theme.textMuted)}>{fmtDate(last.created_at)}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className={cn("text-xl font-semibold tabular-nums", theme.text)}>
                {formatCurrency(last.total_amount, last.currency as CurrencyCode)}
              </p>
              <p className={cn("text-xs", theme.textMuted)}>{last.item_count} kalem</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            {last.preview.map((line, index) => (
              <Thumb key={`${line.name}-${index}`} src={line.image_url} alt={line.name} className="size-14 sm:size-16" />
            ))}
            {last.item_count > last.preview.length ? (
              <span className={cn("flex size-14 items-center justify-center rounded-xl border text-sm font-semibold sm:size-16", theme.border, theme.textMuted)}>
                +{last.item_count - last.preview.length}
              </span>
            ) : null}
          </div>
          <div className="mt-5">
            <OrderProgress status={last.status} />
          </div>
          <div className="mt-5">
            <OrderActions subdomain={subdomain} order={last} />
          </div>
        </section>
      ) : (
        <EmptyOrders />
      )}

      {data.frequent.length ? (
        <section>
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className={cn("text-lg font-semibold", theme.text)}>Sık aldıklarınız</h2>
              <p className={cn("text-sm", theme.textMuted)}>Güncel fiyatlarla, tek dokunuşla ürüne gidin.</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {data.frequent.map((product) => (
              <a
                key={product.id}
                href={product.path}
                className={cn("group flex min-w-0 flex-col rounded-3xl border p-3 transition hover:opacity-90", theme.border, theme.surface)}
              >
                <Thumb src={product.image_url} alt={product.name} className="aspect-square w-full rounded-2xl" />
                <span className={cn("mt-3 line-clamp-2 text-sm font-semibold leading-snug", theme.text)}>{product.name}</span>
                <span className={cn("mt-1 text-xs", theme.textMuted)}>{product.times} siparişte</span>
                <span className="mt-auto flex items-center justify-between gap-2 pt-2">
                  <span className={cn("text-sm font-semibold tabular-nums", theme.text)}>
                    {product.price !== null ? formatCurrency(product.price, product.currency as CurrencyCode) : ""}
                  </span>
                  {!product.is_in_stock ? (
                    <span className={cn("text-xs font-medium", theme.dangerText)}>Stokta yok</span>
                  ) : (
                    <ChevronRight className={cn("size-4", theme.textMuted)} />
                  )}
                </span>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <section className={cn("rounded-3xl border p-5", theme.border, theme.surface)}>
          <p className={cn("flex items-center gap-2 text-sm font-semibold", theme.text)}>
            <MapPin className="size-4" /> Teslimat adresi
          </p>
          <p className={cn("mt-2 min-h-10 break-words text-sm", theme.textMuted)}>
            {defaultAddress ? formatDealerAddress(defaultAddress) : "Henüz adres eklenmedi."}
          </p>
          <button type="button" onClick={() => onNavigate("addresses")} className={cn(buttons.secondary, "mt-3 h-9 px-4 text-xs")}>
            Adresleri yönet
          </button>
        </section>
        <section className={cn("rounded-3xl border p-5", theme.border, theme.surface)}>
          <p className={cn("flex items-center gap-2 text-sm font-semibold", theme.text)}>
            <Receipt className="size-4" /> Fişe yazılan bilgiler
          </p>
          <p className={cn("mt-2 min-h-10 text-sm", theme.textMuted)}>
            {[data.profile.company, data.profile.name, data.profile.phone].filter(Boolean).join(" · ") || "—"}
          </p>
          <button type="button" onClick={() => onNavigate("info")} className={cn(buttons.secondary, "mt-3 h-9 px-4 text-xs")}>
            Bilgileri düzenle
          </button>
        </section>
      </div>
    </div>
  );
}

function EmptyOrders() {
  const theme = useStorefrontTheme();
  const buttons = useButtonClasses();
  return (
    <div className={cn("rounded-3xl border px-6 py-12 text-center", theme.border, theme.surface)}>
      <span className={cn("mx-auto flex size-14 items-center justify-center rounded-2xl", theme.surfaceMuted, theme.textMuted)}>
        <ShoppingBag className="size-6" />
      </span>
      <p className={cn("mt-4 text-base font-semibold", theme.text)}>Henüz siparişiniz yok</p>
      <p className={cn("mt-1 text-sm", theme.textMuted)}>Verdiğiniz siparişler burada listelenir.</p>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/" className={cn(buttons.primary, "mt-5 h-11 px-6 text-sm")}>
        Ürünlere göz at
      </a>
    </div>
  );
}

function OrdersTab({ subdomain, orders }: { subdomain: string; orders: AccountOrder[] }) {
  const theme = useStorefrontTheme();
  if (!orders.length) return <div className="mt-6"><EmptyOrders /></div>;

  return (
    <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-4">
      {orders.map((order) => {
        return (
          <article key={order.id} className={cn("overflow-hidden rounded-3xl border", theme.border, theme.surface)}>
            <div className={cn("flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3", theme.border, theme.surfaceMuted)}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className={cn("text-sm font-semibold", theme.text)}>Sipariş {displayNo(order)}</span>
                <span className={cn("text-xs", theme.textMuted)}>{fmtDate(order.created_at)}</span>
              </div>
              <StatusPill status={order.status} />
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex shrink-0 -space-x-3">
                  {order.preview.slice(0, 3).map((line, index) => (
                    <Thumb key={`${line.name}-${index}`} src={line.image_url} alt={line.name} className="size-12" />
                  ))}
                </div>
                <div className="min-w-0">
                  <p className={cn("truncate text-sm font-medium", theme.text)}>
                    {order.preview[0]?.name ?? "Ürün"} {order.preview[0] ? <span className={theme.textMuted}>× {order.preview[0].quantity}</span> : null}
                  </p>
                  <p className={cn("text-xs", theme.textMuted)}>
                    {order.item_count > 1 ? `+${order.item_count - 1} ürün daha` : "Tek kalem"}
                  </p>
                </div>
              </div>
              <p className={cn("text-left text-lg font-semibold tabular-nums sm:text-right", theme.text)}>
                {formatCurrency(order.total_amount, order.currency as CurrencyCode)}
              </p>
            </div>
            <div className="px-5 pb-5">
              <OrderActions subdomain={subdomain} order={order} />
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
    <form onSubmit={onSubmit} className={cn("mt-6 grid gap-4 rounded-3xl border p-5 sm:p-6", theme.border, theme.surface)}>
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
          <article key={entry.id} className={cn("rounded-3xl border p-4 sm:p-5", theme.border, theme.surface)}>
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
