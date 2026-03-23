import Constants from "expo-constants";
import * as Device from "expo-device";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const AUTH_DEVICE_ID_KEY = "exam_studio_auth_device_id";
const DEVICE_ID_PATTERN = /^[A-Za-z0-9._-]{8,200}$/;

const normalizeText = (value: string | null | undefined, maxLength = 200) => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
};

const normalizeDeviceId = (value: string | null | undefined) => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return DEVICE_ID_PATTERN.test(trimmed) ? trimmed : null;
};

const readStoredDeviceId = async () => {
  try {
    return normalizeDeviceId(await SecureStore.getItemAsync(AUTH_DEVICE_ID_KEY));
  } catch {
    return null;
  }
};

const generateDeviceId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/[^A-Za-z0-9._-]/g, "").slice(0, 64);
  }
  return `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 14)}`;
};

const getOrCreateDeviceId = async () => {
  const existing = await readStoredDeviceId();
  if (existing) {
    return existing;
  }

  const generated = generateDeviceId();
  const normalized = normalizeDeviceId(generated) ?? "unknown_device";

  try {
    await SecureStore.setItemAsync(AUTH_DEVICE_ID_KEY, normalized);
  } catch {
    // Ignore write failures; best-effort metadata only.
  }

  return normalized;
};

const resolvePlatform = () => {
  if (Platform.OS === "android") return "android";
  if (Platform.OS === "ios") return "ios";
  if (Platform.OS === "web") return "web";
  return "unknown";
};

const resolveAppVersion = () => {
  const expoConfigVersion = normalizeText(Constants.expoConfig?.version, 40);
  if (expoConfigVersion) {
    return expoConfigVersion;
  }

  const nativeVersion = normalizeText(Constants.nativeAppVersion, 40);
  if (nativeVersion) {
    return nativeVersion;
  }

  return null;
};

const resolveOsVersion = () => normalizeText(Device.osVersion, 40);

const resolveDeviceModel = () => normalizeText(Device.modelName, 120);

const resolveDeviceLabel = () => {
  const brand = normalizeText(Device.brand, 60);
  const model = normalizeText(Device.modelName, 120);
  const combined = [brand, model].filter(Boolean).join(" ").trim();
  return normalizeText(combined || null, 120);
};

export const getSignInDeviceContext = async () => ({
  deviceId: await getOrCreateDeviceId(),
  deviceLabel: resolveDeviceLabel(),
  devicePlatform: resolvePlatform(),
  deviceModel: resolveDeviceModel(),
  appVersion: resolveAppVersion(),
  osVersion: resolveOsVersion(),
});

