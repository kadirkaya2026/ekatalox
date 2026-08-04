"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  STOREFRONT_DEFAULT_LOCALE,
  isStorefrontLocale,
  storefrontDictionary,
  type StorefrontLocale,
} from "@/lib/storefront/i18n/dictionary";
import { getStorefrontLangCookieName } from "@/lib/storefront/locale-cookie";

export type TranslateParams = Record<string, string | number>;
export type TranslateFn = (key: string, params?: TranslateParams) => string;

interface StorefrontLocaleContextValue {
  locale: StorefrontLocale;
  setLocale: (locale: StorefrontLocale) => void;
  t: TranslateFn;
}

function applyParams(template: string, params?: TranslateParams) {
  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  );
}

function createTranslator(locale: StorefrontLocale): TranslateFn {
  return (key, params) => {
    const template =
      storefrontDictionary[locale][key] ?? storefrontDictionary[STOREFRONT_DEFAULT_LOCALE][key] ?? key;
    return applyParams(template, params);
  };
}

const StorefrontLocaleContext = createContext<StorefrontLocaleContextValue>({
  locale: STOREFRONT_DEFAULT_LOCALE,
  setLocale: () => {},
  t: createTranslator(STOREFRONT_DEFAULT_LOCALE),
});

function readStoredLocale(subdomain: string): StorefrontLocale | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookieName = getStorefrontLangCookieName(subdomain);
  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${cookieName}=`));

  if (!match) {
    return null;
  }

  const value = decodeURIComponent(match.slice(cookieName.length + 1));
  return isStorefrontLocale(value) ? value : null;
}

function writeStoredLocale(subdomain: string, locale: StorefrontLocale) {
  if (typeof document === "undefined") {
    return;
  }

  const cookieName = getStorefrontLangCookieName(subdomain);
  const maxAgeSeconds = 60 * 60 * 24 * 365;
  document.cookie = `${cookieName}=${encodeURIComponent(locale)}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
}

export function StorefrontLocaleProvider({
  subdomain,
  children,
}: {
  subdomain: string;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<StorefrontLocale>(STOREFRONT_DEFAULT_LOCALE);

  useEffect(() => {
    const stored = readStoredLocale(subdomain);
    if (stored && stored !== STOREFRONT_DEFAULT_LOCALE) {
      setLocaleState(stored);
    }
    // Yalnızca mount sonrası bir kez okunur; subdomain bu provider için sabittir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<StorefrontLocaleContextValue>(() => {
    return {
      locale,
      setLocale: (nextLocale: StorefrontLocale) => {
        setLocaleState(nextLocale);
        writeStoredLocale(subdomain, nextLocale);
      },
      t: createTranslator(locale),
    };
  }, [locale, subdomain]);

  return (
    <StorefrontLocaleContext.Provider value={value}>{children}</StorefrontLocaleContext.Provider>
  );
}

export function useStorefrontLocale(): StorefrontLocaleContextValue {
  return useContext(StorefrontLocaleContext);
}
