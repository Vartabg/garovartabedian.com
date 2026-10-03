export type Locale = "en" | "es" | "fr" | "de" | "pt" | "ar" | "zh" | "ja" | "hi";

export const LOCALES: Record<Locale, { name: string; nativeName: string; dir: "ltr" | "rtl" }> = {
  en: { name: "English", nativeName: "English", dir: "ltr" },
  es: { name: "Spanish", nativeName: "Español", dir: "ltr" },
  fr: { name: "French", nativeName: "Français", dir: "ltr" },
  de: { name: "German", nativeName: "Deutsch", dir: "ltr" },
  pt: { name: "Portuguese", nativeName: "Português", dir: "ltr" },
  ar: { name: "Arabic", nativeName: "العربية", dir: "rtl" },
  zh: { name: "Simplified Chinese", nativeName: "简体中文", dir: "ltr" },
  ja: { name: "Japanese", nativeName: "日本語", dir: "ltr" },
  hi: { name: "Hindi", nativeName: "हिन्दी", dir: "ltr" },
};

export const DEFAULT_LOCALE: Locale = "en";
