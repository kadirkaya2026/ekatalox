"use client";

// Market/tekel üyelik sayfaları (17 Eki 2026, kullanıcı isteği — Getir "Profil"
// örneği): ayrı /giris ve /uye-ol sayfaları, giriş sonrası /hesabim menüsü ve
// alt sayfaları. Üstte renkli bar (geri tuşu + başlık + dil), mobilde altta
// vitrinle aynı alt bar. Geri tuşu tarayıcı geçmişini kullanır; geçmiş yoksa
// (link doğrudan açıldıysa) bir üst sayfaya gider.
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Gift,
  Globe,
  KeyRound,
  LogOut,
  MapPin,
  MessageCircle,
  PackageCheck,
  Pencil,
  Plus,
  UserRound,
} from "lucide-react";
import { AddressForm, useMemberAddresses, type MemberAddress } from "@/components/storefront/market-checkout";
import { MemberAuthForm, type StoreMemberProfile } from "@/components/storefront/member-auth";
import { OrderSections, type OrderRow } from "@/components/storefront/my-orders-view";
import { StorefrontBottomNav } from "@/components/storefront/storefront-bottom-nav";
import { StorefrontLanguageSwitcher } from "@/components/storefront/storefront-language-switcher";
import { useUnseenOrderUpdates } from "@/components/storefront/order-tracking-badge";
import { useStorefrontTheme } from "@/lib/storefront/theme-context";
import { useStorefrontLocale } from "@/lib/storefront/locale-context";
import { markSeen, readGuestOrderTokens, setMemberSignedInHint } from "@/lib/storefront/tracking-phone";
import { cn } from "@/lib/utils";

type ShellProps = {
  subdomain: string;
  tenantId: string;
  isTekel: boolean;
  title: string;
  /** Geçmiş yoksa geri tuşunun gideceği sayfa. */
  backHref: string;
  /** Alt barda Hesabım sekmesi aktif mi. */
  accountActive?: boolean;
  children: ReactNode;
};

type BaseProps = Omit<ShellProps, "title" | "backHref" | "children" | "accountActive">;

const LOCALE_NAMES: Record<string, string> = { tr: "Türkçe", de: "Deutsch", en: "English", ru: "Русский" };

function goBack(fallback: string) {
  const sameOrigin = document.referrer.startsWith(window.location.origin);
  if (sameOrigin && window.history.length > 1) window.history.back();
  else window.location.href = fallback;
}

function useStoredCartCount(tenantId: string) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let value = 0;
    try {
      const parsed = JSON.parse(window.localStorage.getItem(`ekatalox_cart_${tenantId}`) ?? "[]") as unknown;
      // Vitrindeki sayaçla aynı: toplam adet.
      value = Array.isArray(parsed)
        ? parsed.reduce((sum: number, item: { quantity?: unknown }) => sum + (typeof item?.quantity === "number" ? item.quantity : 0), 0)
        : 0;
    } catch {
      /* depolama kapalı */
    }
    const timer = window.setTimeout(() => setCount(value), 0);
    return () => window.clearTimeout(timer);
  }, [tenantId]);
  return count;
}

export function MemberShell({ subdomain, tenantId, isTekel, title, backHref, accountActive = true, children }: ShellProps) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();
  const cartCount = useStoredCartCount(tenantId);
  const updates = useUnseenOrderUpdates(subdomain);

  return (
    <div data-storefront className={cn(theme.page, "flex min-h-svh flex-col")}>
      <header className="sticky top-0 z-30 bg-orange-600 text-white shadow-sm">
        <div className="mx-auto grid h-14 max-w-xl grid-cols-[3rem_1fr_3rem] items-center px-2">
          <button
            type="button"
            onClick={() => goBack(backHref)}
            className="flex size-11 items-center justify-center rounded-full transition hover:bg-white/15"
            aria-label={t("member.back")}
          >
            <ChevronLeft className="size-6" />
          </button>
          <h1 className="truncate text-center text-base font-bold">{title}</h1>
          <div className="flex justify-end">
            <StorefrontLanguageSwitcher />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-28 pt-5 sm:pb-12">{children}</main>
      <StorefrontBottomNav cartItemCount={cartCount} isTekel={isTekel} accountHref="/hesabim" accountBadge={updates} isAccountActive={accountActive} />
    </div>
  );
}

function Card({ className, children }: { className?: string; children: ReactNode }) {
  const theme = useStorefrontTheme();
  return <div className={cn("rounded-2xl border shadow-sm", theme.border, theme.surface, className)}>{children}</div>;
}

// Vitrine tam sayfa dönüş (Link değil: vitrin proxy'de tenant yoluna yazılıyor).
function GuestLink() {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();
  return (
    <button
      type="button"
      onClick={() => {
        window.location.href = "/";
      }}
      className={cn("mt-5 block w-full text-center text-sm font-semibold underline-offset-2 hover:underline", theme.textMuted)}
    >
      {t("member.continueAsGuest")}
    </button>
  );
}

function afterAuth(next: string | null) {
  setMemberSignedInHint(true);
  window.location.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/hesabim");
}

type AuthPageProps = BaseProps & { storeName: string; next: string | null; resetToken?: string | null };

export function MemberLoginPage(props: AuthPageProps) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();
  const nextQuery = props.next ? `?next=${encodeURIComponent(props.next)}` : "";
  return (
    <MemberShell {...props} title={t("member.login")} backHref="/">
      <Card className="p-5">
        <p className={cn("text-lg font-semibold", theme.text)}>{props.storeName}</p>
        <p className={cn("mt-1 text-sm", theme.textMuted)}>{t("member.loginIntro")}</p>
        <MemberAuthForm
          className="mt-4"
          subdomain={props.subdomain}
          initialMode="login"
          resetToken={props.resetToken}
          hideTabs
          onAuthed={() => afterAuth(props.next)}
        />
      </Card>
      <Card className="mt-4 flex items-center justify-between gap-3 p-4">
        <span className={cn("text-sm", theme.textMuted)}>{t("member.noAccount")}</span>
        <a href={`/uye-ol${nextQuery}`} className={cn(theme.primaryButton, "inline-flex h-10 items-center justify-center px-5 text-sm")}>
          {t("member.register")}
        </a>
      </Card>
      <GuestLink />
    </MemberShell>
  );
}

export function MemberRegisterPage(props: AuthPageProps) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();
  const nextQuery = props.next ? `?next=${encodeURIComponent(props.next)}` : "";
  return (
    <MemberShell {...props} title={t("member.register")} backHref={`/giris${nextQuery}`}>
      <Card className="p-5">
        <p className={cn("text-lg font-semibold", theme.text)}>{props.storeName}</p>
        <p className={cn("mt-1 text-sm", theme.textMuted)}>{t("member.cartPitch")}</p>
        <MemberAuthForm className="mt-4" subdomain={props.subdomain} initialMode="register" hideTabs onAuthed={() => afterAuth(props.next)} />
      </Card>
      <Card className="mt-4 flex items-center justify-between gap-3 p-4">
        <span className={cn("text-sm", theme.textMuted)}>{t("member.haveAccount")}</span>
        <a href={`/giris${nextQuery}`} className={cn("inline-flex h-10 items-center rounded-xl border px-5 text-sm font-semibold", theme.border, theme.text)}>
          {t("member.login")}
        </a>
      </Card>
      <GuestLink />
    </MemberShell>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toLocaleUpperCase("tr-TR") || "?";
}

function MenuRow({
  href,
  icon,
  label,
  onClick,
  danger = false,
}: {
  href?: string;
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  const theme = useStorefrontTheme();
  const inner = (
    <>
      <span className={cn("flex size-6 items-center justify-center", danger ? "text-rose-600" : "text-orange-600")}>{icon}</span>
      <span className={cn("flex-1 text-[15px] font-medium", danger ? "text-rose-600" : theme.text)}>{label}</span>
      {danger ? null : <ChevronRight className="size-5 text-orange-600" />}
    </>
  );
  const cls = "flex w-full items-center gap-3 px-4 py-4 text-left transition hover:opacity-80";
  return href ? (
    <a href={href} className={cls}>
      {inner}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

type MemberProps = BaseProps & { member: StoreMemberProfile };

export function MemberProfilePage(props: MemberProps & { whatsapp: string | null }) {
  const theme = useStorefrontTheme();
  const { t, locale } = useStorefrontLocale();
  const updates = useUnseenOrderUpdates(props.subdomain);
  const { member } = props;

  const logout = async () => {
    await fetch("/api/storefront/member", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout", subdomain: props.subdomain }),
    }).catch(() => undefined);
    setMemberSignedInHint(false);
    window.location.replace("/");
  };

  const tiles: Array<{ href: string; icon: ReactNode; label: string; badge: number; external?: boolean }> = [
    { href: "/hesabim/siparisler", icon: <PackageCheck className="size-8" />, label: t("member.myOrders"), badge: updates },
    { href: "/?kampanyalar=1", icon: <Gift className="size-8" />, label: t("bottomNav.campaigns"), badge: 0 },
  ];
  if (props.whatsapp) {
    tiles.push({ href: `https://wa.me/${props.whatsapp}`, icon: <MessageCircle className="size-8" />, label: t("member.contactStore"), badge: 0, external: true });
  }

  return (
    <MemberShell {...props} title={t("member.profile")} backHref="/">
      <Card className="flex items-center gap-4 p-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-xl font-semibold text-orange-600">
          {initials(member.full_name || "")}
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn("text-lg font-bold", theme.text)}>{t("member.hello")} 👋</p>
          <p className={cn("truncate text-[15px]", theme.textMuted)}>{member.full_name || member.phone}</p>
        </div>
        <a href="/hesabim/bilgilerim" className="flex size-10 items-center justify-center text-orange-600" aria-label={t("member.myInfo")}>
          <Pencil className="size-5" />
        </a>
      </Card>

      <div className={cn("mt-3 grid gap-3", tiles.length === 3 ? "grid-cols-3" : "grid-cols-2")}>
        {tiles.map((tile) => (
          <a
            key={tile.href}
            href={tile.href}
            target={tile.external ? "_blank" : undefined}
            rel={tile.external ? "noreferrer" : undefined}
            className={cn(
              "flex flex-col items-center gap-2 rounded-2xl border px-2 py-4 text-center shadow-sm transition hover:opacity-90",
              theme.border,
              theme.surface,
            )}
          >
            <span className="relative text-orange-600">
              {tile.icon}
              {tile.badge > 0 ? (
                <span className="absolute -right-2.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                  {tile.badge > 9 ? "9+" : tile.badge}
                </span>
              ) : null}
            </span>
            <span className={cn("text-[13px] font-medium leading-tight", theme.text)}>{tile.label}</span>
          </a>
        ))}
      </div>

      <Card className={cn("mt-3 divide-y overflow-hidden", theme.border)}>
        <MenuRow href="/hesabim/adres" icon={<MapPin className="size-5" />} label={t("member.myAddress")} />
        <MenuRow href="/hesabim/bilgilerim" icon={<UserRound className="size-5" />} label={t("member.myInfo")} />
        <MenuRow href="/hesabim/sifre" icon={<KeyRound className="size-5" />} label={t("member.changePassword")} />
        <MenuRow href="/bildirim" icon={<Bell className="size-5" />} label={t("member.notifications")} />
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="flex size-6 items-center justify-center text-orange-600">
            <Globe className="size-5" />
          </span>
          <span className={cn("flex-1 text-[15px] font-medium", theme.text)}>{t("member.language")}</span>
          <span className={cn("text-sm", theme.textMuted)}>{LOCALE_NAMES[locale] ?? locale}</span>
          <StorefrontLanguageSwitcher />
        </div>
      </Card>

      <Card className="mt-3 overflow-hidden">
        <MenuRow icon={<LogOut className="size-5" />} label={t("member.logout")} onClick={() => void logout()} danger />
      </Card>
      <p className={cn("mt-6 text-center text-xs", theme.textMuted)}>{member.phone}</p>
    </MemberShell>
  );
}

export function MemberOrdersPage(props: MemberProps) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();
  const [orders, setOrders] = useState<OrderRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const r = await fetch("/api/storefront/my-orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subdomain: props.subdomain, tokens: readGuestOrderTokens() }),
        });
        const d = (await r.json().catch(() => null)) as { orders?: OrderRow[] } | null;
        if (cancelled) return;
        const list = d?.orders ?? [];
        setOrders(list);
        // Listeyi gören üye güncellemeleri görmüş sayılır → sayaçlar söner.
        markSeen(list.map((o) => ({ orderNo: o.order_no, statusUpdatedAt: o.status_updated_at })));
      } catch {
        if (!cancelled) setOrders([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [props.subdomain]);

  return (
    <MemberShell {...props} title={t("member.myOrders")} backHref="/hesabim">
      {orders === null ? (
        <p className={cn("py-10 text-center text-sm", theme.textMuted)}>{t("orders.loading")}</p>
      ) : (
        <div className="-mt-8">
          <OrderSections orders={orders} isTekel={props.isTekel} />
        </div>
      )}
    </MemberShell>
  );
}

type MemberPatch = Partial<{ full_name: string; address: string; email: string | null; current_password: string; new_password: string }>;

function useMemberSave(subdomain: string, member: StoreMemberProfile) {
  const { t } = useStorefrontLocale();
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const save = async (patch: MemberPatch) => {
    setPending(true);
    setMsg(null);
    try {
      const r = await fetch("/api/storefront/member", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subdomain, full_name: member.full_name, address: member.address, email: member.email, ...patch }),
      });
      const d = (await r.json().catch(() => null)) as { error?: string } | null;
      if (!r.ok) {
        setMsg({ ok: false, text: d?.error ?? t("member.error") });
        return false;
      }
      setMsg({ ok: true, text: t("member.saved") });
      return true;
    } catch {
      setMsg({ ok: false, text: t("member.error") });
      return false;
    } finally {
      setPending(false);
    }
  };
  return { pending, msg, save };
}

function FormCard({
  onSubmit,
  pending,
  msg,
  children,
}: {
  onSubmit: (e: FormEvent) => void;
  pending: boolean;
  msg: { ok: boolean; text: string } | null;
  children: ReactNode;
}) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();
  return (
    <form onSubmit={onSubmit}>
      <Card className="space-y-4 p-5">{children}</Card>
      {msg ? <p className={cn("mt-3 text-sm font-medium", msg.ok ? "text-emerald-600" : theme.dangerText)}>{msg.text}</p> : null}
      <button type="submit" disabled={pending} className={cn(theme.primaryButton, "mt-4 h-12 w-full justify-center text-base disabled:opacity-60")}>
        {pending ? t("member.wait") : t("member.save")}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  const theme = useStorefrontTheme();
  return (
    <label className="block">
      <span className={cn("mb-1.5 block text-xs font-semibold", theme.textMuted)}>{label}</span>
      {children}
    </label>
  );
}

function useFieldClass() {
  const theme = useStorefrontTheme();
  return cn("w-full rounded-xl border px-3 py-3 text-[16px] outline-none", theme.border, theme.surface, theme.text);
}

export function MemberInfoPage(props: MemberProps) {
  const { t } = useStorefrontLocale();
  const field = useFieldClass();
  const [fullName, setFullName] = useState(props.member.full_name);
  const [email, setEmail] = useState(props.member.email ?? "");
  const { pending, msg, save } = useMemberSave(props.subdomain, props.member);
  return (
    <MemberShell {...props} title={t("member.myInfo")} backHref="/hesabim">
      <FormCard
        pending={pending}
        msg={msg}
        onSubmit={(e) => {
          e.preventDefault();
          void save({ full_name: fullName, email: email || null });
        }}
      >
        <Field label={t("member.fullName")}>
          <input className={field} value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" required />
        </Field>
        <Field label={t("member.phone")}>
          <input className={cn(field, "opacity-60")} value={props.member.phone} disabled />
        </Field>
        <Field label={t("member.emailOptional")}>
          <input type="email" className={field} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </Field>
      </FormCard>
    </MemberShell>
  );
}

export function MemberAddressPage(props: MemberProps) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();
  const { addresses, setAddresses } = useMemberAddresses(props.subdomain, true);
  const [editing, setEditing] = useState<MemberAddress | "new" | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const mutate = async (method: "PATCH" | "DELETE", id: string) => {
    setPendingId(id);
    try {
      const url =
        method === "DELETE"
          ? `/api/storefront/member/addresses?subdomain=${encodeURIComponent(props.subdomain)}&id=${encodeURIComponent(id)}`
          : "/api/storefront/member/addresses";
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: method === "PATCH" ? JSON.stringify({ subdomain: props.subdomain, id, make_default: true }) : undefined,
      });
      const d = (await r.json().catch(() => null)) as { addresses?: MemberAddress[] } | null;
      if (d?.addresses) setAddresses(d.addresses);
    } finally {
      setPendingId(null);
    }
  };

  return (
    <MemberShell {...props} title={t("member.myAddress")} backHref="/hesabim">
      {addresses === null ? (
        <p className={cn("py-10 text-center text-sm", theme.textMuted)}>{t("orders.loading")}</p>
      ) : (
        <div className="space-y-3">
          {addresses.map((a) =>
            editing !== "new" && editing?.id === a.id ? (
              <AddressForm
                key={a.id}
                subdomain={props.subdomain}
                initial={a}
                onSaved={(list) => {
                  setAddresses(list);
                  setEditing(null);
                }}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <Card key={a.id} className="p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-5 shrink-0 text-orange-600" />
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-[15px] font-semibold", theme.text)}>
                      {a.title}
                      {a.is_default ? (
                        <span className="ml-2 rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-700">
                          {t("checkout.address.primary")}
                        </span>
                      ) : null}
                    </p>
                    <p className={cn("mt-0.5 text-sm", theme.textMuted)}>{a.address}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 pl-8">
                  <button type="button" onClick={() => setEditing(a)} className="text-sm font-semibold text-orange-600">
                    {t("member.edit")}
                  </button>
                  {a.is_default ? null : (
                    <button type="button" disabled={pendingId === a.id} onClick={() => void mutate("PATCH", a.id)} className={cn("text-sm font-semibold", theme.text)}>
                      · {t("member.makePrimary")}
                    </button>
                  )}
                  <button type="button" disabled={pendingId === a.id} onClick={() => void mutate("DELETE", a.id)} className="text-sm font-semibold text-rose-600">
                    · {t("member.delete")}
                  </button>
                </div>
              </Card>
            ),
          )}
          {editing === "new" ? (
            <AddressForm
              subdomain={props.subdomain}
              onSaved={(list) => {
                setAddresses(list);
                setEditing(null);
              }}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditing("new")}
              className={cn("flex w-full items-center gap-3 rounded-2xl border px-4 py-4 text-left shadow-sm", theme.border, theme.surface)}
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <Plus className="size-5" />
              </span>
              <span className={cn("text-[15px] font-semibold", theme.text)}>{t("checkout.address.add")}</span>
            </button>
          )}
        </div>
      )}
    </MemberShell>
  );
}

export function MemberPasswordPage(props: MemberProps) {
  const { t } = useStorefrontLocale();
  const field = useFieldClass();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const { pending, msg, save } = useMemberSave(props.subdomain, props.member);
  return (
    <MemberShell {...props} title={t("member.changePassword")} backHref="/hesabim">
      <FormCard
        pending={pending}
        msg={msg}
        onSubmit={(e) => {
          e.preventDefault();
          void save({ current_password: current, new_password: next }).then((ok) => {
            if (ok) {
              setCurrent("");
              setNext("");
            }
          });
        }}
      >
        <Field label={t("member.currentPassword")}>
          <input type="password" className={field} value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
        </Field>
        <Field label={t("member.newPassword")}>
          <input type="password" className={field} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" minLength={6} required />
        </Field>
      </FormCard>
    </MemberShell>
  );
}
