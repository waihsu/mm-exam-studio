export type AppLocale = "en-US" | "my-MM";
export type AppTimeZone = "device" | "utc";
export type AppDateFormat = "mdy" | "dmy" | "ymd";
export type PracticeReminderMinutes = 15 | 30 | 60;

export type AppSettings = {
  autoSavePracticeDrafts: boolean;
  confirmBeforeSubmitPractice: boolean;
  locale: AppLocale;
  timeZone: AppTimeZone;
  dateFormat: AppDateFormat;
  use24HourClock: boolean;
  practiceReminderEnabled: boolean;
  practiceReminderMinutes: PracticeReminderMinutes;
};

export type UpdateAppSettingsInput = Partial<AppSettings>;

export const DEFAULT_APP_SETTINGS: AppSettings = {
  autoSavePracticeDrafts: true,
  confirmBeforeSubmitPractice: true,
  locale: "en-US",
  timeZone: "device",
  dateFormat: "mdy",
  use24HourClock: false,
  practiceReminderEnabled: false,
  practiceReminderMinutes: 30,
};
