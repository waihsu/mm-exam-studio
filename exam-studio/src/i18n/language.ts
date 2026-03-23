import type { AppLocale } from "@/features/settings/types/settings.types";

export type AppLanguage = "en" | "my";

export const mapAppLocaleToLanguage = (locale?: AppLocale | null): AppLanguage =>
  locale === "my-MM" ? "my" : "en";
