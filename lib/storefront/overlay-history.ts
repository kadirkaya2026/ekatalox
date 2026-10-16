"use client";

import { useEffect, useRef } from "react";

// Telefonun geri tuşu açık katmanı (sepet, sepet adımı, filtre, model seçimi)
// kapatsın, siteden çıkmasın (17 Eki 2026, kullanıcı: "sepette geri tuşuna
// basınca siteden çıkıyor"). Katman açılınca aynı adrese bir geçmiş kaydı
// eklenir; geri tuşu onu tüketip EN ÜSTTEKİ katmanı kapatır. Katman düğmeyle
// kapanırsa kayıt history.back() ile geri alınır; o popstate vitrinin ana
// dinleyicisinde (storefront-client) yok sayılır.

// Sayfada tek vitrin olduğundan sayaç modül düzeyinde tutulur.
export const overlayHistory = {
  /** Geçmiş kaydı açık katman sayısı. */
  depth: 0,
  /** Kendi tetiklediğimiz history.back() sayısı (dinleyicide atlanır). */
  skip: 0,
  /** Bir geri basışı yalnız bir katman işlesin (iç içe sepet + sepet adımı). */
  handled: null as PopStateEvent | null,
};

/**
 * Bir popstate kendi history.back()'imizden geldiyse onu tüketir (bir kez) ve
 * true döner; başka dinleyici bu olayı işlediyse de true. Vitrinin ana
 * dinleyicisi ve katmanlar ortak kullanır, sıradan bağımsız doğru çalışır.
 */
export function consumeOverlayPop(event: PopStateEvent) {
  if (overlayHistory.handled === event) return true;
  if (overlayHistory.skip > 0) {
    overlayHistory.skip -= 1;
    overlayHistory.handled = event;
    return true;
  }
  return false;
}

export function useOverlayHistory(open: boolean, onBack: () => void) {
  const onBackRef = useRef(onBack);
  useEffect(() => {
    onBackRef.current = onBack;
  });
  useEffect(() => {
    if (!open) return;
    window.history.pushState({ ...(window.history.state ?? {}), ekKatman: true }, "");
    overlayHistory.depth += 1;
    const level = overlayHistory.depth;
    let closedByBack = false;
    const onPop = (event: PopStateEvent) => {
      // Kendi history.back()'imiz, bu basışı başka katman işledi ya da üstte
      // başka katman var: dokunma.
      if (consumeOverlayPop(event) || overlayHistory.depth !== level) return;
      overlayHistory.handled = event;
      closedByBack = true;
      overlayHistory.depth -= 1;
      onBackRef.current();
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      if (closedByBack) return;
      overlayHistory.depth = Math.max(0, overlayHistory.depth - 1);
      // Katman düğmeyle kapandı ve kaydımız hâlâ en üstte: geri al. (Bu arada
      // ürün sayfası gibi yeni bir kayıt eklendiyse ona dokunulmaz.)
      if ((window.history.state as { ekKatman?: boolean } | null)?.ekKatman) {
        overlayHistory.skip += 1;
        window.history.back();
      }
    };
  }, [open]);
}
