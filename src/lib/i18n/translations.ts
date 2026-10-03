import type { Locale } from "./locales";

export interface TranslationObject {
  [key: string]: string | number | TranslationObject;
}

const translationCache: Partial<Record<Locale, TranslationObject>> = {};

export async function loadTranslations(locale: Locale): Promise<TranslationObject> {
  if (translationCache[locale]) {
    return translationCache[locale]!;
  }

  try {
    const translations = await import(`./locales/${locale}.json`);
    translationCache[locale] = translations.default;
    return translations.default;
  } catch {
    console.warn(`Failed to load translations for locale: ${locale}`);
    if (locale !== "en") {
      return loadTranslations("en");
    }
    return {};
  }
}

export function getNestedValue(
  obj: TranslationObject,
  path: string
): string | TranslationObject | undefined {
  return path.split(".").reduce((current: TranslationObject | undefined, prop) => {
    if (!current || typeof current !== "object") return undefined;
    return current[prop] as TranslationObject | undefined;
  }, obj) as string | TranslationObject | undefined;
}

export function interpolate(template: string, values: Record<string, string | number>): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
  }
  return result;
}

export function t(
  translations: TranslationObject,
  key: string,
  values?: Record<string, string | number>
): string {
  const value = getNestedValue(translations, key);
  if (typeof value !== "string") {
    console.warn(`Translation key not found: ${key}`);
    return key;
  }
  if (values) {
    return interpolate(value, values);
  }
  return value;
}
