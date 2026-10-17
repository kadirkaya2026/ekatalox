"use client";

// Market/tekel vitrin üyeliği (0180, 17 Eki 2026): giriş / üye ol / şifremi
// unuttum / yeni şifre formu ve oturumdaki üyeyi okuyan kanca. Hem
// "Siparişlerim" sayfasında hem sepette (Giriş yap · Üye ol · Üyeliksiz devam) kullanılır.
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { KeyRound, Lock, Mail, MapPin, Phone, User } from "lucide-react";
import { useStorefrontTheme } from "@/lib/storefront/theme-context";
import { useStorefrontLocale } from "@/lib/storefront/locale-context";
import { readGuestOrderTokens, setMemberSignedInHint } from "@/lib/storefront/tracking-phone";
import { cn } from "@/lib/utils";

export type StoreMemberProfile = {
  id: string;
  phone: string;
  full_name: string;
  address: string;
  email: string | null;
};

export type MemberAuthMode = "login" | "register" | "forgot" | "reset";

export const MEMBER_CHANGED_EVENT = "ekx-member-changed";

/** Oturumdaki üye. enabled=false (toptancı) iken istek atılmaz. */
export function useStoreMember(subdomain: string, enabled = true) {
  const [member, setMemberState] = useState<StoreMemberProfile | null>(null);
  const [loaded, setLoaded] = useState(!enabled);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch(`/api/storefront/member?subdomain=${encodeURIComponent(subdomain)}`, { cache: "no-store" });
      const d = (await r.json().catch(() => null)) as { member?: StoreMemberProfile | null } | null;
      setMemberState(d?.member ?? null);
      setMemberSignedInHint(Boolean(d?.member));
    } catch {
      /* ağ hatası: misafir say */
    } finally {
      setLoaded(true);
    }
  }, [subdomain]);

  useEffect(() => {
    if (!enabled) return;
    const timer = window.setTimeout(() => void refresh(), 0);
    const onChange = () => void refresh();
    window.addEventListener(MEMBER_CHANGED_EVENT, onChange);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(MEMBER_CHANGED_EVENT, onChange);
    };
  }, [enabled, refresh]);

  // Giriş/çıkış sonrası aynı sayfadaki diğer kancalar (sepet, başlık rozeti) tazelensin.
  const setMember = useCallback((next: StoreMemberProfile | null) => {
    setMemberState(next);
    setMemberSignedInHint(Boolean(next));
    window.dispatchEvent(new Event(MEMBER_CHANGED_EVENT));
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/storefront/member", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout", subdomain }),
    }).catch(() => undefined);
    setMember(null);
  }, [subdomain, setMember]);

  return { member, loaded, setMember, logout, refresh };
}

const SUBMIT_LABEL: Record<MemberAuthMode, string> = {
  login: "member.loginSubmit",
  register: "member.registerSubmit",
  forgot: "member.forgotSubmit",
  reset: "member.resetSubmit",
};

export function MemberAuthForm({
  subdomain,
  initialMode = "login",
  resetToken,
  defaultPhone = "",
  onAuthed,
  onCancel,
  cancelLabel,
  className,
}: {
  subdomain: string;
  initialMode?: MemberAuthMode;
  resetToken?: string | null;
  defaultPhone?: string;
  onAuthed: (member: StoreMemberProfile) => void;
  onCancel?: () => void;
  cancelLabel?: string;
  className?: string;
}) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();
  const [mode, setMode] = useState<MemberAuthMode>(resetToken ? "reset" : initialMode);
  const [phone, setPhone] = useState(defaultPhone);
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const switchMode = (next: MemberAuthMode) => {
    setMode(next);
    setError(null);
    setInfo(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    setInfo(null);
    const guest_tokens = readGuestOrderTokens();
    const payload =
      mode === "login"
        ? { action: "login", subdomain, phone, password, guest_tokens }
        : mode === "register"
          ? { action: "register", subdomain, phone, password, full_name: fullName, address, email: email || null, guest_tokens }
          : mode === "forgot"
            ? { action: "forgot", subdomain, identifier }
            : { action: "reset", subdomain, token: resetToken, password };
    try {
      const r = await fetch("/api/storefront/member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = (await r.json().catch(() => null)) as {
        member?: StoreMemberProfile;
        error?: string;
        code?: string;
        message?: string;
      } | null;
      if (!r.ok) {
        setError(d?.error ?? t("member.error"));
        if (d?.code === "phone_taken") setMode("login");
        return;
      }
      if (mode === "forgot") {
        setInfo(d?.message ?? t("member.forgotSent"));
        return;
      }
      if (d?.member) onAuthed(d.member);
    } catch {
      setError(t("member.error"));
    } finally {
      setPending(false);
    }
  };

  const field = cn("flex items-center gap-2 rounded-xl border px-3 py-2.5", theme.border, theme.surface);
  const input = cn("w-full bg-transparent text-[16px] outline-none placeholder:opacity-50", theme.text);
  const icon = cn("size-4 shrink-0", theme.textMuted);
  const link = cn("text-xs font-semibold underline-offset-2 hover:underline", theme.text);
  const tabbed = mode === "login" || mode === "register";

  return (
    <form onSubmit={submit} className={cn("space-y-3", className)}>
      {tabbed ? (
        <div className={cn("grid grid-cols-2 gap-1 rounded-xl p-1", theme.surfaceMuted)}>
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={cn(
                "h-9 rounded-lg text-sm font-semibold transition",
                mode === m ? cn(theme.surface, theme.text, "shadow-sm") : theme.textMuted,
              )}
            >
              {t(m === "login" ? "member.login" : "member.register")}
            </button>
          ))}
        </div>
      ) : (
        <p className={cn("text-sm font-semibold", theme.text)}>{t(mode === "forgot" ? "member.forgotTitle" : "member.resetTitle")}</p>
      )}

      {tabbed ? (
        <label className={field}>
          <Phone className={icon} />
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t("member.phone")}
            className={input}
            required
          />
        </label>
      ) : null}

      {mode === "register" ? (
        <>
          <label className={field}>
            <User className={icon} />
            <input
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t("member.fullName")}
              className={input}
              required
            />
          </label>
          <label className={cn(field, "items-start")}>
            <MapPin className={cn(icon, "mt-1")} />
            <textarea
              rows={2}
              autoComplete="street-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t("member.address")}
              className={cn(input, "resize-none")}
            />
          </label>
          <label className={field}>
            <Mail className={icon} />
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("member.emailOptional")}
              className={input}
            />
          </label>
        </>
      ) : null}

      {mode === "forgot" ? (
        <>
          <p className={cn("text-xs leading-5", theme.textMuted)}>{t("member.forgotHint")}</p>
          <label className={field}>
            <KeyRound className={icon} />
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={t("member.forgotIdentifier")}
              className={input}
              required
            />
          </label>
        </>
      ) : (
        <label className={field}>
          <Lock className={icon} />
          <input
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t(mode === "login" ? "member.password" : "member.newPassword")}
            className={input}
            minLength={mode === "login" ? 1 : 6}
            required
          />
        </label>
      )}

      {mode === "register" ? <p className={cn("text-xs leading-5", theme.textMuted)}>{t("member.registerHint")}</p> : null}
      {error ? <p className={cn("text-sm font-medium", theme.dangerText)}>{error}</p> : null}
      {info ? <p className={cn("rounded-xl p-3 text-sm", theme.surfaceMuted, theme.text)}>{info}</p> : null}

      <button type="submit" disabled={pending} className={cn(theme.primaryButton, "h-12 w-full justify-center text-base disabled:opacity-60")}>
        {pending ? t("member.wait") : t(SUBMIT_LABEL[mode])}
      </button>

      <div className="flex flex-wrap items-center justify-between gap-2">
        {mode === "login" ? (
          <button type="button" className={link} onClick={() => switchMode("forgot")}>
            {t("member.forgotLink")}
          </button>
        ) : mode === "forgot" || mode === "reset" ? (
          <button type="button" className={link} onClick={() => switchMode("login")}>
            {t("member.backToLogin")}
          </button>
        ) : (
          <span />
        )}
        {onCancel ? (
          <button type="button" className={cn(link, theme.textMuted)} onClick={onCancel}>
            {cancelLabel ?? t("member.continueAsGuest")}
          </button>
        ) : null}
      </div>
    </form>
  );
}

/** Sepetteki üyelik kutusu: Giriş yap · Üye ol · (aşağıdaki formla) üyeliksiz devam. */
export function CartMemberBox({
  subdomain,
  member,
  defaultPhone,
  onAuthed,
  onLogout,
}: {
  subdomain: string;
  member: StoreMemberProfile | null;
  defaultPhone?: string;
  onAuthed: (member: StoreMemberProfile) => void;
  onLogout: () => void;
}) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();
  const [openMode, setOpenMode] = useState<"login" | "register" | null>(null);
  const box = cn("mt-3 rounded-2xl border p-3", theme.border, theme.surfaceMuted);

  if (member) {
    return (
      <div className={cn(box, "flex items-center justify-between gap-3")}>
        <div className="min-w-0">
          <p className={cn("truncate text-sm font-semibold", theme.text)}>
            {t("member.hello")}
            {member.full_name ? `, ${member.full_name}` : ""}
          </p>
          <p className={cn("text-xs", theme.textMuted)}>{t("member.cartLoggedIn")}</p>
        </div>
        <button type="button" onClick={onLogout} className={cn("shrink-0 text-xs font-semibold underline-offset-2 hover:underline", theme.textMuted)}>
          {t("member.logout")}
        </button>
      </div>
    );
  }

  if (openMode) {
    return (
      <div className={box}>
        <MemberAuthForm
          key={openMode}
          subdomain={subdomain}
          initialMode={openMode}
          defaultPhone={defaultPhone}
          onAuthed={(m) => {
            setOpenMode(null);
            onAuthed(m);
          }}
          onCancel={() => setOpenMode(null)}
        />
      </div>
    );
  }

  return (
    <div className={box}>
      <p className={cn("text-sm font-semibold", theme.text)}>{t("member.cartTitle")}</p>
      <p className={cn("mt-0.5 text-xs leading-5", theme.textMuted)}>{t("member.cartPitch")}</p>
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setOpenMode("login")}
          className={cn("h-10 rounded-xl border text-sm font-semibold", theme.border, theme.surface, theme.text)}
        >
          {t("member.login")}
        </button>
        <button type="button" onClick={() => setOpenMode("register")} className={cn(theme.primaryButton, "h-10 justify-center text-sm")}>
          {t("member.register")}
        </button>
      </div>
      <p className={cn("mt-2 text-center text-xs", theme.textMuted)}>{t("member.cartGuestHint")}</p>
    </div>
  );
}
