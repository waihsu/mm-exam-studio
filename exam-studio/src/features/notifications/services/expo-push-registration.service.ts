import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Network from "expo-network";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { ensureLocalNotificationPermission, initializeAppNotifications } from "@/features/practice/services/practice-reminder-notification.service";
import { apiRequest } from "@/lib/api-client";

const PUSH_INSTALLATION_ID_KEY = "exam_studio_push_installation_id";

const normalizeValue = (value: string | null | undefined) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
};

const readStoredInstallationId = async () => {
  try {
    return normalizeValue(await SecureStore.getItemAsync(PUSH_INSTALLATION_ID_KEY));
  } catch {
    return null;
  }
};

const getOrCreateInstallationId = async () => {
  const existing = await readStoredInstallationId();
  if (existing) {
    return existing;
  }

  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  try {
    await SecureStore.setItemAsync(PUSH_INSTALLATION_ID_KEY, generated);
  } catch {
    // Ignore storage failures. The token can still register for this run.
  }

  return generated;
};

const resolveExpoProjectId = () => {
  const expoExtra = Constants.expoConfig?.extra as
    | {
        eas?: { projectId?: string };
      }
    | undefined;

  return (
    normalizeValue(Constants.easConfig?.projectId) ??
    normalizeValue(expoExtra?.eas?.projectId) ??
    normalizeValue(process.env.EXPO_PUBLIC_EAS_PROJECT_ID)
  );
};

const buildDeviceLabel = () => {
  const brand = normalizeValue(Device.brand);
  const model = normalizeValue(Device.modelName);
  return [brand, model].filter(Boolean).join(" ") || null;
};

const isExpoPushNetworkReachable = async () => {
  try {
    const state = await Network.getNetworkStateAsync();
    if (state.isConnected === false) {
      return false;
    }
    if (state.isInternetReachable === false) {
      return false;
    }
    return true;
  } catch {
    return true;
  }
};

export const syncExpoPushRegistration = async () => {
  if (Platform.OS === "web") {
    return { registered: false as const, reason: "unsupported" };
  }

  await initializeAppNotifications();

  const permission = await ensureLocalNotificationPermission();
  if (!permission.granted) {
    await unregisterExpoPushRegistration().catch(() => undefined);
    return { registered: false as const, reason: "permission-denied" };
  }

  if (!Device.isDevice) {
    return { registered: false as const, reason: "simulator" };
  }

  const networkReachable = await isExpoPushNetworkReachable();
  if (!networkReachable) {
    return { registered: false as const, reason: "offline" };
  }

  const projectId = resolveExpoProjectId();
  if (!projectId) {
    console.warn("[push] Missing Expo projectId. Skipping push registration.");
    return { registered: false as const, reason: "missing-project-id" };
  }

  const installationId = await getOrCreateInstallationId();
  const pushToken = normalizeValue(
    (await Notifications.getExpoPushTokenAsync({ projectId })).data,
  );

  if (!pushToken) {
    return { registered: false as const, reason: "missing-token" };
  }

  await apiRequest("/api/v1/users/my/push-tokens/register", {
    method: "POST",
    body: {
      installationId,
      pushToken,
      platform: Platform.OS === "ios" ? "ios" : "android",
      deviceLabel: buildDeviceLabel(),
    },
  });

  return {
    registered: true as const,
    pushToken,
  };
};

export const unregisterExpoPushRegistration = async () => {
  if (Platform.OS === "web") {
    return;
  }

  const installationId = await readStoredInstallationId();
  if (!installationId) {
    return;
  }

  await apiRequest("/api/v1/users/my/push-tokens/unregister", {
    method: "POST",
    body: {
      installationId,
    },
  });
};
