import { useI18n } from "./context";
import { t, getNestedValue } from "./translations";
import type { Locale } from "./locales";

export function useTranslation() {
  const { translations, locale } = useI18n();

  return {
    t: (key: string, values?: Record<string, string | number>) => t(translations, key, values),
    locale,
    get: (key: string) => getNestedValue(translations, key),
  };
}

export { useI18n, type Locale };
export { DEFAULT_LOCALE, LOCALES } from "./locales";
