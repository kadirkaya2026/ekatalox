"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

// Tenant gece/gündüz butonunu kapattığında, sadece butonu gizlemek yetmiyor:
// ziyaretçinin tarayıcısında (veya sistem tercihinde) daha önce kaydedilmiş
// "dark" tercihi kalıcı olarak uygulanmaya devam ediyor — geri dönecek buton
// olmadığı için mağaza karanlık modda "takılı" kalıyor. Buton kapalıyken
// temayı açıkça light'a sabitleyerek bunu önlüyoruz.
export function StorefrontThemeReset({ isToggleVisible }: { isToggleVisible: boolean }) {
  const { setTheme } = useTheme();

  useEffect(() => {
    if (!isToggleVisible) {
      setTheme("light");
    }
  }, [isToggleVisible, setTheme]);

  return null;
}
