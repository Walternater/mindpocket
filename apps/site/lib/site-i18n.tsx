"use client"

import {
  getSiteDictionary,
  type Locale,
  type SiteTranslationDict,
} from "@repo/i18n"
import React from "react"

export type SiteLocale = Locale

const STORAGE_KEY = "mindpocket-site-locale"

interface SiteI18nContextValue {
  locale: SiteLocale
  setLocale: (locale: SiteLocale) => void
  t: SiteTranslationDict
}

const SiteI18nContext = React.createContext<SiteI18nContextValue | null>(null)

export function SiteI18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<SiteLocale>("zh")

  React.useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved === "zh" || saved === "en") {
      setLocaleState(saved)
      return
    }
    const inferred = navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en"
    setLocaleState(inferred)
  }, [])

  React.useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, locale)
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en"
  }, [locale])

  const value = React.useMemo(
    () => ({
      locale,
      setLocale: setLocaleState,
      t: getSiteDictionary(locale),
    }),
    [locale]
  )

  return <SiteI18nContext.Provider value={value}>{children}</SiteI18nContext.Provider>
}

export function useSiteI18n() {
  const context = React.useContext(SiteI18nContext)
  if (!context) {
    throw new Error("useSiteI18n must be used within SiteI18nProvider")
  }
  return context
}
