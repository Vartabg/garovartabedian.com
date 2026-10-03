"use client";

import { useI18n, useTranslation } from "@/lib/i18n";
import { LOCALES, type Locale } from "@/lib/i18n/locales";

export default function LanguageSelector() {
  const { locale, setLocale } = useI18n();
  const { t } = useTranslation();

  return (
    <div className="jsu-language-selector">
      <span className="jsu-language-copy">
        <label htmlFor="language-select" className="jsu-language-label">
          {t("life.language.label")}
        </label>
        <small id="language-scope">{t("life.language.scope")}</small>
      </span>
      <select
        id="language-select"
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="jsu-language-select"
        aria-describedby="language-scope"
      >
        {Object.entries(LOCALES).map(([code, config]) => (
          <option key={code} value={code}>
            {config.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
}
