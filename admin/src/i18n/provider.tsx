/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type AppLanguage = "en" | "my";

export type LocalizedText = {
  en: string;
  my: string;
};

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  toggleLanguage: () => void;
  tr: (value: LocalizedText) => string;
};

const LANGUAGE_STORAGE_KEY = "study-admin:language";

const LanguageContext = createContext<LanguageContextValue | null>(null);

const detectInitialLanguage = (): AppLanguage => {
  if (typeof window === "undefined") {
    return "en";
  }

  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored === "en" || stored === "my") {
    return stored;
  }

  const locale = window.navigator.language.toLowerCase();
  return locale.startsWith("my") ? "my" : "en";
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<AppLanguage>(detectInitialLanguage);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language === "my" ? "my" : "en";
  }, [language]);

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => (prev === "en" ? "my" : "en"));
  }, []);

  const tr = useCallback(
    (value: LocalizedText) => {
      return value[language] ?? value.en;
    },
    [language],
  );

  const contextValue = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      tr,
    }),
    [language, toggleLanguage, tr],
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }

  return context;
}
