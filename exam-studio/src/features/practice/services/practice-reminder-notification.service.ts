import * as SecureStore from "expo-secure-store";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const PRACTICE_REMINDER_STORE_KEY = "exam_studio_practice_reminders_v1";
const PRACTICE_REMINDER_CHANNEL_ID = "practice-reminders";
const SUPPORT_REPLY_CHANNEL_ID = "support-replies";

type PracticeReminderRecord = {
  notificationId: string;
  startedAt: string;
  title: string;
  minutes: number;
  dueAt: number;
};

type PracticeReminderStore = Record<string, PracticeReminderRecord>;

type PermissionSnapshot = {
  granted: boolean;
  canAskAgain: boolean;
  status: string;
};

let notificationsInitialized = false;

const isNotificationsSupported = () => Platform.OS !== "web";

const readReminderStore = async (): Promise<PracticeReminderStore> => {
  try {
    const raw = await SecureStore.getItemAsync(PRACTICE_REMINDER_STORE_KEY);
    if (!raw?.trim()) {
      return {};
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return parsed as PracticeReminderStore;
  } catch {
    return {};
  }
};

const writeReminderStore = async (value: PracticeReminderStore) => {
  try {
    if (Object.keys(value).length === 0) {
      await SecureStore.deleteItemAsync(PRACTICE_REMINDER_STORE_KEY);
      return;
    }

    await SecureStore.setItemAsync(PRACTICE_REMINDER_STORE_KEY, JSON.stringify(value));
  } catch {
    // Ignore local storage failures so reminders don't block the app.
  }
};

const cancelNotificationSafely = async (notificationId: string) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Ignore cancellation failures to keep cleanup resilient.
  }
};

const toDueAtTimestamp = (startedAt: string, minutes: number) =>
  new Date(startedAt).getTime() + minutes * 60_000;

const toReminderTriggerDate = (startedAt: string, minutes: number) => {
  const dueAt = toDueAtTimestamp(startedAt, minutes);
  if (!Number.isFinite(dueAt)) {
    throw new Error("Invalid practice session start time.");
  }

  return new Date(Math.max(Date.now() + 1_000, dueAt));
};

const scheduleReminderInternal = async (params: {
  sessionId: string;
  startedAt: string;
  title: string;
  minutes: number;
}) => {
  const store = await readReminderStore();
  const dueAt = toDueAtTimestamp(params.startedAt, params.minutes);
  const existing = store[params.sessionId];

  if (
    existing &&
    existing.startedAt === params.startedAt &&
    existing.title === params.title &&
    existing.minutes === params.minutes &&
    existing.dueAt === dueAt
  ) {
    return existing.notificationId;
  }

  if (existing) {
    await cancelNotificationSafely(existing.notificationId);
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Practice Reminder",
      body: `${params.title} is still active. Review unanswered questions before submitting.`,
      data: {
        kind: "practice-reminder",
        sessionId: params.sessionId,
      },
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: toReminderTriggerDate(params.startedAt, params.minutes),
      channelId: PRACTICE_REMINDER_CHANNEL_ID,
    },
  });

  store[params.sessionId] = {
    notificationId,
    startedAt: params.startedAt,
    title: params.title,
    minutes: params.minutes,
    dueAt,
  };
  await writeReminderStore(store);

  return notificationId;
};

export type LocalNotificationPermissionState = {
  supported: boolean;
  granted: boolean;
  canAskAgain: boolean;
  status: string;
};

export const initializeAppNotifications = async () => {
  if (!isNotificationsSupported()) {
    return;
  }

  if (!notificationsInitialized) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    notificationsInitialized = true;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(PRACTICE_REMINDER_CHANNEL_ID, {
      name: "Practice reminders",
      description: "Reminder alerts for active practice sessions.",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 200, 150, 200],
      lightColor: "#2563EB",
    });
    await Notifications.setNotificationChannelAsync(SUPPORT_REPLY_CHANNEL_ID, {
      name: "Support replies",
      description: "Alerts when admin replies to your support conversation.",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 180, 120, 180],
      lightColor: "#10B981",
    });
  }
};

export const getLocalNotificationPermissionState =
  async (): Promise<LocalNotificationPermissionState> => {
    if (!isNotificationsSupported()) {
      return {
        supported: false,
        granted: false,
        canAskAgain: false,
        status: "unsupported",
      };
    }

    const permission = (await Notifications.getPermissionsAsync()) as PermissionSnapshot;
    return {
      supported: true,
      granted: permission.granted,
      canAskAgain: permission.canAskAgain,
      status: permission.status,
    };
  };

export const ensureLocalNotificationPermission = async () => {
  await initializeAppNotifications();

  const current = await getLocalNotificationPermissionState();
  if (!current.supported || current.granted) {
    return current;
  }

  const requested = (await Notifications.requestPermissionsAsync()) as PermissionSnapshot;
  return {
    supported: true,
    granted: requested.granted,
    canAskAgain: requested.canAskAgain,
    status: requested.status,
  } satisfies LocalNotificationPermissionState;
};

export const syncPracticeReminderNotification = async (params: {
  sessionId: string;
  startedAt: string;
  title: string;
  enabled: boolean;
  minutes: number;
}) => {
  if (!params.enabled || !isNotificationsSupported()) {
    await clearPracticeReminderNotification(params.sessionId);
    return;
  }

  const permission = await ensureLocalNotificationPermission();
  if (!permission.granted) {
    throw new Error("Notification permission is required for practice reminders.");
  }

  await scheduleReminderInternal(params);
};

export const clearPracticeReminderNotification = async (sessionId: string) => {
  if (!isNotificationsSupported()) {
    return;
  }

  const store = await readReminderStore();
  const existing = store[sessionId];
  if (!existing) {
    return;
  }

  await cancelNotificationSafely(existing.notificationId);
  delete store[sessionId];
  await writeReminderStore(store);
};

export const clearAllPracticeReminderNotifications = async () => {
  if (!isNotificationsSupported()) {
    return;
  }

  const store = await readReminderStore();
  await Promise.all(
    Object.values(store).map((record) => cancelNotificationSafely(record.notificationId)),
  );
  await writeReminderStore({});
};

export const showSupportReplyNotification = async (params: {
  conversationId: string;
  senderName?: string | null;
  body?: string | null;
}) => {
  if (!isNotificationsSupported()) {
    return false;
  }

  await initializeAppNotifications();
  const permission = await getLocalNotificationPermissionState();
  if (!permission.granted) {
    return false;
  }

  const senderName = params.senderName?.trim() || "Admin";
  const body = params.body?.trim() || "Open support to read the latest reply.";

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${senderName} replied to support`,
      body,
      data: {
        kind: "support-reply",
        conversationId: params.conversationId,
      },
      sound: false,
    },
    trigger:
      Platform.OS === "android"
        ? {
            channelId: SUPPORT_REPLY_CHANNEL_ID,
            seconds: 1,
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          }
        : null,
  });

  return true;
};

export const rescheduleAllPracticeReminderNotifications = async (
  minutes: number,
) => {
  if (!isNotificationsSupported()) {
    return;
  }

  const permission = await ensureLocalNotificationPermission();
  if (!permission.granted) {
    throw new Error("Notification permission is required for practice reminders.");
  }

  const store = await readReminderStore();
  for (const [sessionId, record] of Object.entries(store)) {
    await scheduleReminderInternal({
      sessionId,
      startedAt: record.startedAt,
      title: record.title,
      minutes,
    });
  }
};
