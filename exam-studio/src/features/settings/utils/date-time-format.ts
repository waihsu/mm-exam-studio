import type { AppSettings } from "../types/settings.types";

const pad2 = (value: string | undefined, fallback: string) => {
  const normalized = value?.trim();
  if (!normalized) return fallback;
  return normalized;
};

const toDate = (value: string | number | Date | null | undefined) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
};

export const formatDateTimeWithSettings = (
  value: string | number | Date | null | undefined,
  settings: Pick<AppSettings, "locale" | "timeZone" | "dateFormat" | "use24HourClock">,
) => {
  const date = toDate(value);
  if (!date) return "-";

  const formatter = new Intl.DateTimeFormat(settings.locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: !settings.use24HourClock,
    ...(settings.timeZone === "utc" ? { timeZone: "UTC" } : {}),
  });

  const parts = formatter.formatToParts(date);
  const byType = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;

  const year = pad2(byType("year"), "0000");
  const month = pad2(byType("month"), "00");
  const day = pad2(byType("day"), "00");
  const hour = pad2(byType("hour"), "00");
  const minute = pad2(byType("minute"), "00");
  const dayPeriod = byType("dayPeriod")?.trim();

  const dateText =
    settings.dateFormat === "ymd"
      ? `${year}-${month}-${day}`
      : settings.dateFormat === "dmy"
        ? `${day}/${month}/${year}`
        : `${month}/${day}/${year}`;

  const timeText = settings.use24HourClock
    ? `${hour}:${minute}`
    : `${hour}:${minute}${dayPeriod ? ` ${dayPeriod}` : ""}`;

  return `${dateText} ${timeText}`.trim();
};
