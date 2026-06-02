import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { I18nManager } from "react-native";

import { ar, en } from "@/lib/strings";

export type Lang = "ar" | "en";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  isRTL: boolean;
}

export const LanguageContext = createContext<LanguageContextValue>({
  lang: "ar",
  setLang: () => {},
  isRTL: true,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    AsyncStorage.getItem("@lang").then((saved) => {
      const next: Lang = saved === "en" ? "en" : "ar";
      setLangState(next);
      const shouldRTL = next === "ar";
      I18nManager.allowRTL(shouldRTL);
      I18nManager.forceRTL(shouldRTL);
    });
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    AsyncStorage.setItem("@lang", next).catch(() => {});
    const shouldRTL = next === "ar";
    if (I18nManager.isRTL !== shouldRTL) {
      I18nManager.allowRTL(shouldRTL);
      I18nManager.forceRTL(shouldRTL);
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, setLang, isRTL: lang === "ar" }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function useStrings() {
  const { lang } = useLanguage();
  return lang === "ar" ? ar : en;
}
