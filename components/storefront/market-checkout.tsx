"use client";

// Market sepetinin son adımı, Getir "Ödeme Yap" düzeninde (17 Eki 2026,
// kullanıcı isteği): teslimat adresi (üyede kayıtlı adres seçimi, üyeliksizde
// "Üye olmadan devam et" ile açılan ad/telefon/adres), sipariş notu (hazır
// seçenekli), ödeme yöntemi (Değiştir → seçim paneli), sepet özeti (küçük
// resimler, açılınca ürünler). Alanların kendisi ve sipariş gönderimi sepet
// çekmecesinde (storefront-cart-drawer) kalır.
import { useCallback, useEffect, useState, type ReactNode, type Ref } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Banknote, Briefcase, Check, ChevronDown, CreditCard, Home, Landmark, MapPin, Plus, UserRound, X } from "lucide-react";
import type { StoreMemberProfile } from "@/components/storefront/member-auth";
import { StorefrontImage } from "@/components/storefront/storefront-image";
import { ProductImagePlaceholder } from "@/components/product-image-placeholder";
import { STOREFRONT_CART_THUMB_SIZES } from "@/lib/storefront/image-sizes";
import type { CheckoutPaymentMethod } from "@/lib/storefront/payment-methods";
import { useStorefrontTheme } from "@/lib/storefront/theme-context";
import { useStorefrontLocale } from "@/lib/storefront/locale-context";
import type { CartItem } from "@/lib/types";
import { useOverlayHistory } from "@/lib/storefront/overlay-history";
import { cn } from "@/lib/utils";

export type MemberAddress = {
  id: string;
  title: string;
  address: string;
  is_default: boolean;
  /** Teslim alacak kişi (ör. annesi); boşsa üyenin kendisi. */
  recipient_name?: string | null;
  recipient_phone?: string | null;
};

export function CheckoutSection({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  const theme = useStorefrontTheme();
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3 px-1">
        <h3 className={cn("text-[15px] font-semibold", theme.text)}>{title}</h3>
        {action}
      </div>
      <div className={cn("rounded-2xl border p-3.5 shadow-sm", theme.border, theme.surface)}>{children}</div>
    </section>
  );
}

function OutlineButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded-xl border-2 border-orange-600 px-4 py-1.5 text-sm font-bold text-orange-600 transition hover:bg-orange-50"
    >
      {children}
    </button>
  );
}

// Çekmecenin üstünde alttan açılan panel (ödeme yöntemi, adres seçimi).
function InnerSheet({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();
  // Telefonun geri tuşu paneli kapatsın, sepetten çıkmasın.
  useOverlayHistory(open, onClose);
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={cn(
              "max-h-[85svh] w-full overflow-y-auto rounded-t-3xl pb-[max(1rem,env(safe-area-inset-bottom))] sm:max-w-md sm:rounded-3xl",
              theme.page,
            )}
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            exit={{ y: 40 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 grid grid-cols-[3rem_1fr_3rem] items-center bg-orange-600 px-2 py-3 text-white">
              <button
                type="button"
                onClick={onClose}
                className="flex size-10 items-center justify-center rounded-full hover:bg-white/15"
                aria-label={t("common.close")}
              >
                <X className="size-5" />
              </button>
              <p className="text-center text-base font-bold">{title}</p>
              <span />
            </div>
            <div className="space-y-3 p-4">{children}</div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Radio({ active }: { active: boolean }) {
  return (
    <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full border-2", active ? "border-orange-600" : "border-slate-300")}>
      {active ? <span className="size-2.5 rounded-full bg-orange-600" /> : null}
    </span>
  );
}

const METHOD_ICON: Record<CheckoutPaymentMethod, typeof Banknote> = { cash: Banknote, card: CreditCard, transfer: Landmark };

export function PaymentMethodSection({
  methods,
  selected,
  onSelect,
  error,
  anchorRef,
}: {
  methods: CheckoutPaymentMethod[];
  selected: CheckoutPaymentMethod | null;
  onSelect: (method: CheckoutPaymentMethod) => void;
  error: string | null;
  anchorRef?: Ref<HTMLDivElement>;
}) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();
  const [open, setOpen] = useState(false);
  const Icon = selected ? METHOD_ICON[selected] : CreditCard;

  return (
    <div ref={anchorRef}>
      <CheckoutSection title={t("checkout.paymentMethod")}>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl border",
              theme.border,
              selected ? "text-orange-600" : theme.textMuted,
            )}
          >
            <Icon className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className={cn("text-[15px] font-semibold", theme.text)}>
              {selected ? t(`checkout.method.${selected}`) : t("checkout.choosePayment")}
            </p>
            {selected ? <p className={cn("text-xs", theme.textMuted)}>{t(`checkout.methodHint.${selected}`)}</p> : null}
          </div>
          <OutlineButton onClick={() => setOpen(true)}>{selected ? t("checkout.change") : t("checkout.choose")}</OutlineButton>
        </div>
        {error ? <p className={cn("mt-2 text-xs font-medium", theme.dangerText)}>{error}</p> : null}
      </CheckoutSection>
      <InnerSheet open={open} title={t("checkout.paymentMethods")} onClose={() => setOpen(false)}>
        <div className="px-1">
          <p className={cn("text-[15px] font-semibold", theme.text)}>{t("checkout.payOnDelivery")}</p>
          <p className={cn("text-sm", theme.textMuted)}>{t("checkout.payOnDeliveryHint")}</p>
        </div>
        <div className={cn("divide-y overflow-hidden rounded-2xl border", theme.border, theme.surface)}>
          {methods.map((method) => {
            const MethodIcon = METHOD_ICON[method];
            return (
              <button
                key={method}
                type="button"
                onClick={() => {
                  onSelect(method);
                  setOpen(false);
                }}
                className={cn("flex w-full items-center gap-3 px-4 py-4 text-left", theme.border)}
              >
                <Radio active={selected === method} />
                <span className={cn("flex size-10 items-center justify-center rounded-xl border text-orange-600", theme.border)}>
                  <MethodIcon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-[15px] font-semibold", theme.text)}>{t(`checkout.method.${method}`)}</span>
                  <span className={cn("block text-xs", theme.textMuted)}>{t(`checkout.methodHint.${method}`)}</span>
                </span>
              </button>
            );
          })}
        </div>
      </InnerSheet>
    </div>
  );
}

const NOTE_PRESETS = ["checkout.note.leaveAtDoor", "checkout.note.noBell"] as const;

function noteParts(note: string) {
  return note
    .split(" · ")
    .map((p) => p.trim())
    .filter(Boolean);
}

export function OrderNoteSection({
  title,
  note,
  onChange,
  error,
  placeholder,
}: {
  title: string;
  note: string;
  onChange: (value: string) => void;
  error: string | null;
  placeholder: string;
}) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();
  // Hazır seçenekler notun sonuna "· Siparişi kapıya bırak" olarak eklenir/çıkarılır.
  const toggle = (phrase: string) => {
    const parts = noteParts(note);
    onChange((parts.includes(phrase) ? parts.filter((p) => p !== phrase) : [...parts, phrase]).join(" · "));
  };
  return (
    <CheckoutSection title={title}>
      <textarea
        value={note}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className={cn("w-full resize-none rounded-xl border px-3 py-2.5 text-[16px] outline-none", theme.border, theme.surface, theme.text)}
      />
      <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-2">
        {NOTE_PRESETS.map((key) => {
          const phrase = t(key);
          const active = noteParts(note).includes(phrase);
          return (
            <button key={key} type="button" onClick={() => toggle(phrase)} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-md border-2",
                  active ? "border-orange-600 bg-orange-600 text-white" : "border-slate-300",
                )}
              >
                {active ? <Check className="size-3.5" strokeWidth={3} /> : null}
              </span>
              <span className={cn("text-sm", theme.text)}>{phrase}</span>
            </button>
          );
        })}
      </div>
      {error ? <p className={cn("mt-2 text-xs font-medium", theme.dangerText)}>{error}</p> : null}
    </CheckoutSection>
  );
}

function itemKey(item: CartItem) {
  return `${item.product_id}-${item.variant_id ?? ""}`;
}

function ItemImage({ item, className }: { item: CartItem; className: string }) {
  return item.image_url ? (
    <StorefrontImage src={item.image_url} alt={item.product_name} className={className} sizes={STOREFRONT_CART_THUMB_SIZES} />
  ) : (
    <ProductImagePlaceholder productName={item.product_name} className="size-full" />
  );
}

export function CartItemsSection({ items }: { items: CartItem[] }) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();
  const [open, setOpen] = useState(false);
  const visible = items.filter((item) => !item.is_gift);
  return (
    <CheckoutSection title={t("checkout.cartSummary")}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-3">
        <span className={cn("text-[15px] font-medium", theme.text)}>
          {t("checkout.products")} ({visible.length})
        </span>
        <span className="flex items-center">
          {open ? null : (
            <span className="mr-1 flex -space-x-2">
              {visible.slice(0, 3).map((item) => (
                <span key={itemKey(item)} className={cn("relative block size-9 overflow-hidden rounded-full border bg-white", theme.border)}>
                  <ItemImage item={item} className="object-contain p-1" />
                </span>
              ))}
            </span>
          )}
          <span className="flex size-9 items-center justify-center rounded-full bg-orange-50 text-orange-600">
            <ChevronDown className={cn("size-5 transition", open && "rotate-180")} />
          </span>
        </span>
      </button>
      {open ? (
        <div className={cn("mt-3 grid grid-cols-3 gap-3 border-t pt-3", theme.border)}>
          {visible.map((item) => (
            <div key={itemKey(item)} className="min-w-0">
              <div className={cn("overflow-hidden rounded-xl border", theme.border)}>
                <div className="relative aspect-square bg-white">
                  <ItemImage item={item} className="object-contain p-2" />
                </div>
                <p className="bg-orange-50 py-1 text-center text-sm font-semibold text-orange-700">
                  {item.quantity} {item.sales_unit || t("checkout.piece")}
                </p>
              </div>
              <p className={cn("mt-1.5 line-clamp-2 text-xs leading-tight", theme.text)}>{item.product_name}</p>
            </div>
          ))}
        </div>
      ) : null}
    </CheckoutSection>
  );
}

// ---------------------------------------------------------------------------
// Teslimat adresi

const TITLE_PRESETS = [
  { key: "checkout.address.home", icon: Home },
  { key: "checkout.address.work", icon: Briefcase },
] as const;

function TitleIcon({ title, className }: { title: string | null; className: string }) {
  const lower = (title ?? "").toLocaleLowerCase("tr-TR");
  if (lower.includes("iş") || lower.includes("ofis") || lower.includes("work")) return <Briefcase className={className} />;
  if (lower.includes("ev") || lower.includes("home")) return <Home className={className} />;
  return <MapPin className={className} />;
}

export function useMemberAddresses(subdomain: string, enabled: boolean) {
  const [addresses, setAddresses] = useState<MemberAddress[] | null>(null);
  const refresh = useCallback(async () => {
    try {
      const r = await fetch(`/api/storefront/member/addresses?subdomain=${encodeURIComponent(subdomain)}`, { cache: "no-store" });
      const d = (await r.json().catch(() => null)) as { addresses?: MemberAddress[] } | null;
      setAddresses(d?.addresses ?? []);
    } catch {
      setAddresses([]);
    }
  }, [subdomain]);
  useEffect(() => {
    if (!enabled) return;
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [enabled, refresh]);
  return { addresses, setAddresses, refresh };
}

export function AddressForm({
  subdomain,
  initial,
  onSaved,
  onCancel,
}: {
  subdomain: string;
  initial?: MemberAddress | null;
  onSaved: (addresses: MemberAddress[], createdId?: string) => void;
  onCancel?: () => void;
}) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();
  const presets = TITLE_PRESETS.map((p) => t(p.key));
  const [title, setTitle] = useState(initial?.title ?? presets[0]);
  const [custom, setCustom] = useState(Boolean(initial && !presets.includes(initial.title)));
  const [address, setAddress] = useState(initial?.address ?? "");
  const [recipientName, setRecipientName] = useState(initial?.recipient_name ?? "");
  const [recipientPhone, setRecipientPhone] = useState(initial?.recipient_phone ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setPending(true);
    setError(null);
    try {
      const r = await fetch("/api/storefront/member/addresses", {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subdomain,
          id: initial?.id,
          title,
          address,
          recipient_name: recipientName || null,
          recipient_phone: recipientPhone || null,
        }),
      });
      const d = (await r.json().catch(() => null)) as { addresses?: MemberAddress[]; created_id?: string; error?: string } | null;
      if (!r.ok || !d?.addresses) {
        setError(d?.error ?? t("member.error"));
        return;
      }
      onSaved(d.addresses, d.created_id);
    } catch {
      setError(t("member.error"));
    } finally {
      setPending(false);
    }
  };

  const chip = (active: boolean) =>
    cn(
      "flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition",
      active ? "border-orange-600 bg-orange-50 text-orange-700" : cn(theme.border, theme.text),
    );
  const field = cn("w-full rounded-xl border px-3 py-2.5 text-[16px] outline-none", theme.border, theme.surface, theme.text);

  return (
    <div className={cn("space-y-3 rounded-2xl border p-4", theme.border, theme.surface)}>
      <p className={cn("text-xs font-semibold", theme.textMuted)}>{t("checkout.address.titleLabel")}</p>
      <div className="flex flex-wrap gap-2">
        {TITLE_PRESETS.map(({ key, icon: PresetIcon }) => {
          const label = t(key);
          return (
            <button
              key={key}
              type="button"
              className={chip(!custom && title === label)}
              onClick={() => {
                setCustom(false);
                setTitle(label);
              }}
            >
              <PresetIcon className="size-4" />
              {label}
            </button>
          );
        })}
        <button
          type="button"
          className={chip(custom)}
          onClick={() => {
            setCustom(true);
            setTitle("");
          }}
        >
          <Plus className="size-4" />
          {t("checkout.address.other")}
        </button>
      </div>
      {custom ? (
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("checkout.address.titlePlaceholder")} maxLength={40} className={field} />
      ) : null}
      <p className={cn("pt-1 text-xs font-semibold", theme.textMuted)}>{t("checkout.address.recipientLabel")}</p>
      <input
        value={recipientName}
        onChange={(e) => setRecipientName(e.target.value)}
        placeholder={t("member.fullName")}
        autoComplete="name"
        maxLength={120}
        className={field}
      />
      <input
        type="tel"
        inputMode="tel"
        value={recipientPhone}
        onChange={(e) => setRecipientPhone(e.target.value)}
        placeholder={t("member.phone")}
        autoComplete="tel"
        className={field}
      />
      <p className={cn("-mt-1 text-xs", theme.textMuted)}>{t("checkout.address.recipientHint")}</p>
      <p className={cn("pt-1 text-xs font-semibold", theme.textMuted)}>{t("member.address")}</p>
      <textarea
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        rows={3}
        placeholder={t("member.address")}
        autoComplete="street-address"
        className={cn(field, "resize-none")}
      />
      {error ? <p className={cn("text-sm font-medium", theme.dangerText)}>{error}</p> : null}
      <div className="flex gap-2">
        {onCancel ? (
          <button type="button" onClick={onCancel} className={cn("h-11 flex-1 rounded-xl border text-sm font-semibold", theme.border, theme.text)}>
            {t("checkout.cancel")}
          </button>
        ) : null}
        <button
          type="button"
          disabled={pending}
          onClick={() => void save()}
          className="h-11 flex-1 rounded-xl bg-orange-600 text-sm font-bold text-white disabled:opacity-60"
        >
          {pending ? t("member.wait") : t("checkout.address.save")}
        </button>
      </div>
    </div>
  );
}

/** Üye: kayıtlı adreslerden seçim (Getir'in adres şeridi + Değiştir). */
export function MemberAddressSection({
  subdomain,
  member,
  selectedAddress,
  onUseAddress,
  error,
  anchorRef,
  locationSlot,
}: {
  subdomain: string;
  member: StoreMemberProfile;
  selectedAddress: string;
  onUseAddress: (address: MemberAddress) => void;
  error: string | null;
  anchorRef?: Ref<HTMLDivElement>;
  /** "Şu anki konumumu ekle" kutusu (sepet çekmecesinden). */
  locationSlot?: ReactNode;
}) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();
  const { addresses, setAddresses } = useMemberAddresses(subdomain, true);
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  // Adresler ilk geldiğinde ana adres sepete yazılır (sepetteki adres kayıtlılardan biri değilse).
  const [autoApplied, setAutoApplied] = useState(false);
  if (addresses && !autoApplied) {
    setAutoApplied(true);
    const primary = addresses.find((a) => a.is_default) ?? addresses[0];
    if (primary && !addresses.some((a) => a.address === selectedAddress)) onUseAddress(primary);
  }
  const current = addresses?.find((a) => a.address === selectedAddress) ?? null;

  const closeSheet = () => {
    setOpen(false);
    setAdding(false);
  };

  return (
    <div ref={anchorRef}>
      <CheckoutSection title={t("checkout.deliveryAddress")}>
        {addresses === null ? (
          <p className={cn("text-sm", theme.textMuted)}>{t("orders.loading")}</p>
        ) : addresses.length === 0 ? (
          adding ? (
            <AddressForm
              subdomain={subdomain}
              onSaved={(list, createdId) => {
                setAddresses(list);
                setAdding(false);
                const created = list.find((a) => a.id === createdId) ?? list[0];
                if (created) onUseAddress(created);
              }}
              onCancel={() => setAdding(false)}
            />
          ) : (
            <div className="flex items-center gap-3">
              <span className={cn("flex-1 text-sm", theme.textMuted)}>{t("checkout.address.none")}</span>
              <OutlineButton onClick={() => setAdding(true)}>{t("checkout.address.add")}</OutlineButton>
            </div>
          )
        ) : (
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <TitleIcon title={current?.title ?? null} className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold text-orange-700">{current?.title ?? t("checkout.address.custom")}</p>
              <p className={cn("line-clamp-2 text-sm", theme.text)}>{selectedAddress || "—"}</p>
            </div>
            <OutlineButton onClick={() => setOpen(true)}>{t("checkout.change")}</OutlineButton>
          </div>
        )}
        <p className={cn("mt-2.5 flex items-center gap-1.5 text-xs", theme.textMuted)}>
          <UserRound className="size-3.5" />
          {current?.recipient_name || member.full_name} · {current?.recipient_phone || member.phone}
        </p>
        {error ? <p className={cn("mt-2 text-xs font-medium", theme.dangerText)}>{error}</p> : null}
        {locationSlot ? <div className="-mb-1">{locationSlot}</div> : null}
      </CheckoutSection>

      <InnerSheet open={open} title={t("checkout.addresses")} onClose={closeSheet}>
        <div className={cn("divide-y overflow-hidden rounded-2xl border", theme.border, theme.surface)}>
          {(addresses ?? []).map((a) => {
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  onUseAddress(a);
                  closeSheet();
                }}
                className={cn("flex w-full items-center gap-3 px-4 py-3.5 text-left", theme.border)}
              >
                <Radio active={a.address === selectedAddress} />
                <TitleIcon title={a.title} className="size-5 shrink-0 text-orange-600" />
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-[15px] font-semibold", theme.text)}>
                    {a.title}
                    {a.is_default ? (
                      <span className="ml-2 rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-700">
                        {t("checkout.address.primary")}
                      </span>
                    ) : null}
                  </span>
                  {a.recipient_name || a.recipient_phone ? (
                    <span className={cn("block text-xs font-medium", theme.text)}>
                      {[a.recipient_name, a.recipient_phone].filter(Boolean).join(" · ")}
                    </span>
                  ) : null}
                  <span className={cn("line-clamp-2 block text-xs", theme.textMuted)}>{a.address}</span>
                </span>
              </button>
            );
          })}
        </div>
        {adding ? (
          <AddressForm
            subdomain={subdomain}
            onSaved={(list, createdId) => {
              setAddresses(list);
              const created = list.find((a) => a.id === createdId);
              if (created) onUseAddress(created);
              closeSheet();
            }}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className={cn("flex w-full items-center gap-3 rounded-2xl border px-4 py-4 text-left", theme.border, theme.surface)}
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <Plus className="size-5" />
            </span>
            <span className={cn("text-[15px] font-semibold", theme.text)}>{t("checkout.address.add")}</span>
          </button>
        )}
      </InnerSheet>
    </div>
  );
}

/** Üyeliksiz: Giriş / Üye ol bağlantıları + "Üye olmadan devam et" (ad, telefon, adres alanlarını açar). */
export function GuestEntrySection({
  guestChosen,
  onChooseGuest,
  children,
}: {
  guestChosen: boolean;
  onChooseGuest: () => void;
  children: ReactNode;
}) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();
  const next = encodeURIComponent("/?sepet=1");
  if (guestChosen) {
    return (
      <CheckoutSection
        title={t("checkout.deliveryInfo")}
        action={
          <a href={`/giris?next=${next}`} className="text-sm font-semibold text-orange-600">
            {t("member.login")}
          </a>
        }
      >
        <div className="-mt-3">{children}</div>
      </CheckoutSection>
    );
  }
  return (
    <CheckoutSection title={t("checkout.deliveryInfo")}>
      <p className={cn("text-sm", theme.textMuted)}>{t("member.cartPitch")}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <a href={`/giris?next=${next}`} className={cn("flex h-11 items-center justify-center rounded-xl border text-sm font-semibold", theme.border, theme.text)}>
          {t("member.login")}
        </a>
        <a href={`/uye-ol?next=${next}`} className="flex h-11 items-center justify-center rounded-xl bg-orange-600 text-sm font-bold text-white">
          {t("member.register")}
        </a>
      </div>
      <button
        type="button"
        onClick={onChooseGuest}
        className={cn("mt-2 flex h-11 w-full items-center justify-center rounded-xl border-2 border-dashed text-sm font-semibold", theme.border, theme.text)}
      >
        {t("checkout.continueWithoutMember")}
      </button>
    </CheckoutSection>
  );
}
