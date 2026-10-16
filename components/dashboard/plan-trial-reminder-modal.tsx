"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CalendarClock, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// Ücretli paket denemesi hatırlatması (17 Eki 2026, kullanıcı isteği): deneme
// sürerken panele HER GÜN ilk girişte açılır (cihaz başına günde bir kez,
// localStorage'da İstanbul tarihi). Deneme bitince plan_trial_ends_at boşalır
// ve pencere kendiliğinden kalkar.

function istanbulDay(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(date);
}

export function PlanTrialReminderModal({
  tenantId,
  companyName,
  planName,
  daysLeft,
  endsAt,
  whatsappHref,
}: {
  tenantId: string;
  companyName: string;
  planName: string;
  daysLeft: number;
  endsAt: string;
  whatsappHref: string;
}) {
  const storageKey = `ekx-deneme-hatirlatma-${tenantId}`;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let seenToday = false;
    try {
      seenToday = window.localStorage.getItem(storageKey) === istanbulDay();
    } catch {
      seenToday = false;
    }
    if (seenToday) return;
    const timer = window.setTimeout(() => setOpen(true), 600);
    return () => window.clearTimeout(timer);
  }, [storageKey]);

  function close() {
    try {
      window.localStorage.setItem(storageKey, istanbulDay());
    } catch {
      // Depolama kapalıysa pencere yalnız bu sayfa için kapanır.
    }
    setOpen(false);
  }

  if (!open) return null;

  const endLabel = new Date(endsAt).toLocaleString("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "numeric",
    month: "long",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
  const whenText = daysLeft <= 0 ? "bugün" : daysLeft === 1 ? "yarın" : `${daysLeft} gün sonra`;
  const message = `Merhaba, ${companyName} mağazamın ${planName} paket denemesi bitiyor. Paketimi kalıcı yapmak istiyorum.`;
  const waHref = `${whatsappHref}?text=${encodeURIComponent(message)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-trial-reminder-title"
      onClick={close}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="relative my-8 w-full max-w-md rounded-2xl bg-card p-6 text-card-foreground shadow-2xl md:p-7"
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

        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
          <CalendarClock className="size-3.5" /> Deneme süresi
        </span>
        <h2 id="plan-trial-reminder-title" className="mt-3 text-xl font-bold text-foreground md:text-2xl">
          {planName} denemeniz {whenText} bitiyor
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Bitiş: <strong className="text-foreground">{endLabel}</strong>
        </p>

        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Süre dolunca mağazanız kapanmaz, <strong>Ücretsiz pakete</strong> geçer: {planName} paketine özel özellikler
          kapanır, ürün ve fiyat listesi sınırları devreye girer, vitrinde eKatalox reklamları görünür.
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          Kesintisiz devam etmek için ödemenizi yapın, paketiniz 1 yıl boyunca kalıcı olsun.
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button asChild className="h-11 flex-1">
            <a href={waHref} target="_blank" rel="noopener noreferrer" onClick={close}>
              <MessageCircle className="size-4" /> WhatsApp&apos;tan yazın
            </a>
          </Button>
          <Button variant="secondary" className="h-11" onClick={close}>
            Daha sonra
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
