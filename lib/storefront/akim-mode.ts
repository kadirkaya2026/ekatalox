"use client";

import { useSyncExternalStore } from "react";

// Akım teması gece (varsayılan) / gündüz modu (30 Eyl 2026, Autovale isteği).
// Akım bilerek koyu tasarlandığı için genel next-themes tercihine (sistem
// teması) bağlanmaz: ziyaretçi başlıktaki düğmeyle gündüze geçerse bu
// tarayıcıda hatırlanır. Vitrin, sepet ve ürün pencereleri aynı değeri okur.
const STORAGE_KEY = "ek-akim-mode";
const EVENT = "ek-akim-mode-change";

function read(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "day";
  } catch {
    return false;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** true = gündüz (açık) modu. Sunucuda ve ilk çizimde gece. */
export function useAkimDayMode(enabled: boolean): boolean {
  const day = useSyncExternalStore(subscribe, read, () => false);
  return enabled && day;
}

export function setAkimDayMode(day: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, day ? "day" : "night");
  } catch {
    // Gizli sekme vb.: yalnız bu oturumda geçerli olmaz, sorun değil.
  }
  window.dispatchEvent(new Event(EVENT));
}
