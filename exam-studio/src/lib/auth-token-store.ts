import * as SecureStore from "expo-secure-store";

const AUTH_TOKEN_KEY = "exam_studio_auth_token";

let cachedToken: string | null | undefined;

const normalizeToken = (value: string | null | undefined) => {
  const token = value?.trim();
  return token && token.length > 0 ? token : null;
};

export const getAuthToken = async () => {
  if (cachedToken !== undefined) {
    return cachedToken;
  }

  try {
    const stored = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    cachedToken = normalizeToken(stored);
    return cachedToken;
  } catch {
    cachedToken = null;
    return null;
  }
};

export const setAuthToken = async (value: string) => {
  const token = normalizeToken(value);
  cachedToken = token;

  if (!token) {
    await clearAuthToken();
    return;
  }

  try {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
  } catch {
    // Ignore secure-store errors to avoid blocking login flow.
  }
};

export const clearAuthToken = async () => {
  cachedToken = null;
  try {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  } catch {
    // Ignore secure-store errors to avoid blocking logout flow.
  }
};
