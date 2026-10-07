"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Package, RotateCcw, Sparkles, UserRound, X } from "lucide-react";

// Panelde bir kerelik "Yenilik" penceresi (8 Eki 2026): vitrine gelen Hesabım
// sayfasını toptancı mağaza sahiplerine duyurur. Kapatılınca bu tarayıcıda bir
// daha çıkmaz (localStorage). Yeni bir duyuru için ANNOUNCEMENT_ID değiştirilir.
const ANNOUNCEMENT_ID = "hesabim-2026-10";
const STORAGE_KEY = `ekx-panel-duyuru-${ANNOUNCEMENT_ID}`;

const FEATURES = [
  { icon: Package, title: "Siparişlerim", body: "Bayiniz geçmiş siparişlerini, durumlarını ve fişlerini görür." },
  { icon: RotateCcw, title: "Tekrar sipariş", body: "Eski siparişi tek dokunuşla, güncel fiyatlarla sepete ekler." },
  { icon: MapPin, title: "Kayıtlı adresler", body: "Birden çok teslimat adresi kaydeder, sepette seçer." },
  { icon: UserRound, title: "Bilgilerim", body: "Firma ve iletişim bilgisini günceller; Müşteriler sayfanıza da yansır." },
];

export function FeatureAnnouncementModal({ hasPersonalCodes }: { hasPersonalCodes: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      seen = false;
    }
    if (seen) return;
    const timer = window.setTimeout(() => setOpen(true), 800);
    return () => window.clearTimeout(timer);
  }, []);

  function close() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Depolama kapalıysa pencere yalnız bu sayfa için kapanır.
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feature-announcement-title"
      onClick={close}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="relative my-8 w-full max-w-lg rounded-2xl bg-card p-6 text-card-foreground shadow-2xl md:p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Kapat"
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="size-3.5" /> Yeni özellik
        </span>
        <h2 id="feature-announcement-title" className="mt-3 text-xl font-bold text-foreground md:text-2xl">
          Bayileriniz için “Hesabım” sayfası
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Size özel şifreyle giren bayileriniz artık kataloğunuzun sağ üstündeki kişi ikonundan kendi hesaplarına
          ulaşabiliyor.
        </p>

        <ul className="mt-5 grid gap-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                <Icon className="size-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-foreground">{title}</span>
                <span className="block text-sm text-muted-foreground">{body}</span>
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-5 rounded-xl bg-muted px-4 py-3 text-xs leading-5 text-muted-foreground">
          {hasPersonalCodes
            ? "Kullanmak için Müşteriler sayfasından bayilerinize kişiye özel şifre tanımlamanız yeterli. Ortak liste şifreleriyle girenlerde Hesabım görünmez."
            : "Hesabım, bayiye özel şifreyle çalışır; kişiye özel şifre Kurumsal pakette yer alır. Ortak liste şifreleriyle girenlerde Hesabım görünmez."}
        </p>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={close}
            className="h-10 rounded-full px-5 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
          >
            Tamam
          </button>
          {hasPersonalCodes ? (
            <a
              href="/customers"
              onClick={close}
              className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Müşterilere şifre tanımla
            </a>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
