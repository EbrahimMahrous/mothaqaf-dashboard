"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { dictionaries, getDirection } from "@/i18n";
import type { Dictionary } from "@/i18n/ar";
import type { Lang } from "@/types";

interface I18nContextValue {
  lang: Lang;
  dir: "rtl" | "ltr";
  t: Dictionary;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("mosaqaf_lang") as Lang | null;
    if (stored === "ar" || stored === "en") setLangState(stored);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("mosaqaf_lang", lang);
    const dir = getDirection(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, mounted]);

  const setLang = (l: Lang) => setLangState(l);
  const toggleLang = () => setLangState((p) => (p === "ar" ? "en" : "ar"));

  return (
    <I18nContext.Provider
      value={{
        lang,
        dir: getDirection(lang),
        t: dictionaries[lang],
        setLang,
        toggleLang,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
};
