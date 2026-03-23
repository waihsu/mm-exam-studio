import authEn from "./en/auth";
import commonEn from "./en/common";
import homeEn from "./en/home";
import papersEn from "./en/papers";
import practiceEn from "./en/practice";
import settingsEn from "./en/settings";
import settingsDetailEn from "./en/settings-detail";
import authMy from "./my/auth";
import commonMy from "./my/common";
import homeMy from "./my/home";
import papersMy from "./my/papers";
import practiceMy from "./my/practice";
import settingsMy from "./my/settings";
import settingsDetailMy from "./my/settings-detail";

export const resources = {
  en: {
    auth: authEn,
    common: commonEn,
    home: homeEn,
    papers: papersEn,
    practice: practiceEn,
    settings: settingsEn,
    settingsDetail: settingsDetailEn,
  },
  my: {
    auth: authMy,
    common: commonMy,
    home: homeMy,
    papers: papersMy,
    practice: practiceMy,
    settings: settingsMy,
    settingsDetail: settingsDetailMy,
  },
} as const;

export type AppI18nResources = typeof resources;
