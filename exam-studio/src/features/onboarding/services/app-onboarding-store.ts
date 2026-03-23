import * as SecureStore from "expo-secure-store";

const APP_ONBOARDING_KEY_PREFIX = "exam_studio_app_onboarding_seen_v1";
const seenThisSession = new Set<string>();

const sanitizeKeyPart = (value: string) =>
  Array.from(value)
    .map((char) =>
      /^[A-Za-z0-9._-]$/.test(char)
        ? char
        : `_${char.codePointAt(0)?.toString(16) ?? "0"}_`,
    )
    .join("");

const toStorageKey = (userId?: string | null) =>
  userId?.trim()
    ? `${APP_ONBOARDING_KEY_PREFIX}_${sanitizeKeyPart(userId.trim())}`
    : APP_ONBOARDING_KEY_PREFIX;

export const hasSeenAppOnboarding = async (userId?: string | null): Promise<boolean> => {
  const key = toStorageKey(userId);
  if (seenThisSession.has(key)) {
    return true;
  }

  try {
    const value = await SecureStore.getItemAsync(key);
    if (value === "1") {
      seenThisSession.add(key);
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

export const markAppOnboardingSeen = async (userId?: string | null) => {
  const key = toStorageKey(userId);
  seenThisSession.add(key);

  try {
    await SecureStore.setItemAsync(key, "1");
  } catch {
    // Ignore storage failures so onboarding does not block app usage.
  }
};
