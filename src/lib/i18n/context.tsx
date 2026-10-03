"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Locale } from "./locales";
import { DEFAULT_LOCALE, LOCALES } from "./locales";
import { loadTranslations, type TranslationObject } from "./translations";
import defaultTranslations from "./locales/en.json";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  translations: TranslationObject;
  isLoading: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);
const LOCALE_STORAGE_KEY = "jesus-life-locale:v1";

function isLocale(value: string): value is Locale {
  return value in LOCALES;
}

export function I18nProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [translations, setTranslations] = useState<TranslationObject>(() =>
    initialLocale === DEFAULT_LOCALE ? defaultTranslations : {},
  );
  const [isLoading, setIsLoading] = useState(initialLocale !== DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    } catch {
      // Storage can be unavailable in privacy-restricted browser contexts.
    }
    if (stored && isLocale(stored) && stored !== initialLocale) {
      setLocale(stored);
    }
    setReady(true);
    return () => {
      document.documentElement.lang = DEFAULT_LOCALE;
      document.documentElement.dir = LOCALES[DEFAULT_LOCALE].dir;
    };
  }, [initialLocale]);

  useEffect(() => {
    if (!ready) return;
    let active = true;
    setIsLoading(true);
    document.documentElement.lang = locale;
    document.documentElement.dir = LOCALES[locale].dir;
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      // Locale still applies for this visit when persistence is unavailable.
    }
    loadTranslations(locale).then((t) => {
      if (!active) return;
      setTranslations(t);
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [locale, ready]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, translations, isLoading }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
