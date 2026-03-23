import type { TFunction } from "i18next";
import type {
  AppDateFormat,
  AppLocale,
  AppTimeZone,
  PracticeReminderMinutes,
} from "../types/settings.types";

export const getLocaleOptions = (t: TFunction<"settings">): Array<{ value: AppLocale; label: string }> => [
  { value: "en-US", label: t("settings:preferences.localeEnglish") },
  { value: "my-MM", label: t("settings:preferences.localeMyanmar") },
];

export const getTimeZoneOptions = (
  t: TFunction<"settings">,
): Array<{ value: AppTimeZone; label: string }> => [
  { value: "device", label: t("settings:preferences.timeZoneDevice") },
  { value: "utc", label: t("settings:preferences.timeZoneUtc") },
];

export const DATE_FORMAT_OPTIONS: Array<{ value: AppDateFormat; label: string }> = [
  { value: "mdy", label: "MM/DD/YYYY" },
  { value: "dmy", label: "DD/MM/YYYY" },
  { value: "ymd", label: "YYYY-MM-DD" },
];

export const REMINDER_MINUTE_OPTIONS: Array<{
  value: PracticeReminderMinutes;
  label: string;
}> = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 60, label: "60 min" },
];
