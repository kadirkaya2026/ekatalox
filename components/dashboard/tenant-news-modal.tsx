"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { TENANT_NEWS } from "@/lib/dashboard/tenant-news";

// Mağazaya özel "Yenilikler" penceresi; içerik ve tarih aralığı lib/dashboard/tenant-news.ts.

export function TenantNewsModal({ tenantId }: { tenantId: string }) {
  const news = TENANT_NEWS[tenantId];
  const storageKey = news ? `ekx-panel-yenilik-${news.id}` : "";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!news) return;
    let seen = false;
    try {
      seen = window.localStorage.getItem(storageKey) === "1";
    } catch {
      seen = false;
    }
    if (seen) return;
    const timer = window.setTimeout(() => setOpen(true), 800);
    return () => window.clearTimeout(timer);
  }, [news, storageKey]);

  function close() {
    try {
      window.localStorage.setItem(storageKey, "1");
    } catch {
      // Depolama kapalıysa pencere yalnız bu sayfa için kapanır.
    }
    setOpen(false);
  }

  if (!news || !open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tenant-news-title"
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
          <Sparkles className="size-3.5" /> Yenilikler
        </span>
        <h2 id="tenant-news-title" className="mt-3 text-xl font-bold text-foreground md:text-2xl">
          {news.title}
        </h2>

        <ul className="mt-5 grid gap-3">
          {news.items.map(({ icon: Icon, title, body }) => (
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

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={close}
            className="h-10 rounded-full px-5 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
          >
            Tamam
          </button>
          <a
            href="/siparisler"
            onClick={close}
            className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Siparişlere git
          </a>
        </div>
      </motion.div>
    </div>
  );
}
