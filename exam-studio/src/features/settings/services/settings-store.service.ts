import * as SecureStore from "expo-secure-store";
import type {
  AppDateFormat,
  AppLocale,
  AppSettings,
  AppTimeZone,
  PracticeReminderMinutes,
  UpdateAppSettingsInput,
} from "../types/settings.types";
import { DEFAULT_APP_SETTINGS } from "../types/settings.types";

const APP_SETTINGS_KEY = "exam_studio_app_settings_v1";

const normalizeBoolean = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;

const normalizeLocale = (value: unknown, fallback: AppLocale): AppLocale =>
  value === "en-US" || value === "my-MM" ? value : fallback;

const normalizeTimeZone = (value: unknown, fallback: AppTimeZone): AppTimeZone =>
  value === "device" || value === "utc" ? value : fallback;

const normalizeDateFormat = (value: unknown, fallback: AppDateFormat): AppDateFormat =>
  value === "mdy" || value === "dmy" || value === "ymd" ? value : fallback;

const normalizeReminderMinutes = (
  value: unknown,
  fallback: PracticeReminderMinutes,
): PracticeReminderMinutes =>
  value === 15 || value === 30 || value === 60 ? value : fallback;

const toAppSettings = (value: unknown): AppSettings => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ...DEFAULT_APP_SETTINGS };
  }

  const parsed = value as Partial<AppSettings>;
  return {
    autoSavePracticeDrafts: normalizeBoolean(
      parsed.autoSavePracticeDrafts,
      DEFAULT_APP_SETTINGS.autoSavePracticeDrafts,
    ),
    confirmBeforeSubmitPractice: normalizeBoolean(
      parsed.confirmBeforeSubmitPractice,
      DEFAULT_APP_SETTINGS.confirmBeforeSubmitPractice,
    ),
    locale: normalizeLocale(parsed.locale, DEFAULT_APP_SETTINGS.locale),
    timeZone: normalizeTimeZone(parsed.timeZone, DEFAULT_APP_SETTINGS.timeZone),
    dateFormat: normalizeDateFormat(parsed.dateFormat, DEFAULT_APP_SETTINGS.dateFormat),
    use24HourClock: normalizeBoolean(parsed.use24HourClock, DEFAULT_APP_SETTINGS.use24HourClock),
    practiceReminderEnabled: normalizeBoolean(
      parsed.practiceReminderEnabled,
      DEFAULT_APP_SETTINGS.practiceReminderEnabled,
    ),
    practiceReminderMinutes: normalizeReminderMinutes(
      parsed.practiceReminderMinutes,
      DEFAULT_APP_SETTINGS.practiceReminderMinutes,
    ),
  };
};

export const getAppSettings = async (): Promise<AppSettings> => {
  try {
    const raw = await SecureStore.getItemAsync(APP_SETTINGS_KEY);
    if (!raw?.trim()) {
      return { ...DEFAULT_APP_SETTINGS };
    }
    return toAppSettings(JSON.parse(raw) as unknown);
  } catch {
    return { ...DEFAULT_APP_SETTINGS };
  }
};

export const updateAppSettings = async (
  patch: UpdateAppSettingsInput,
): Promise<AppSettings> => {
  const current = await getAppSettings();
  const next = toAppSettings({ ...current, ...patch });

  try {
    await SecureStore.setItemAsync(APP_SETTINGS_KEY, JSON.stringify(next));
  } catch {
    // Ignore secure-store errors to avoid blocking settings flow.
  }

  return next;
};
