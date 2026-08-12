"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Kayıt sonrası başarı/hata mesajı için ortak bileşen — fade+slide ile
 * belirir, `onExpire` verilirse birkaç saniye sonra kendini otomatik
 * kapatır (parent state'i null'a çeker), aniden beliren/hiç kaybolmayan
 * eski <p> desenini değiştirir.
 */
export function InlineAlert({
  message,
  tone = "success",
  onExpire,
  duration = 4000,
  className,
}: {
  message: string | null;
  tone?: "success" | "error";
  onExpire?: () => void;
  duration?: number;
  className?: string;
}) {
  useEffect(() => {
    if (!message || !onExpire) {
      return;
    }

    const timer = window.setTimeout(onExpire, duration);
    return () => window.clearTimeout(timer);
  }, [message, onExpire, duration]);

  return (
    <AnimatePresence mode="wait">
      {message ? (
        <motion.p
          key={message}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          className={cn(
            "text-sm",
            tone === "success" ? "text-emerald-700" : "text-amber-700",
            className,
          )}
        >
          {message}
        </motion.p>
      ) : null}
    </AnimatePresence>
  );
}
