const AUTH_TOKEN_STORAGE_KEY = "mm_exam_client_auth_token";

const canUseStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export const getAuthToken = () => {
  if (!canUseStorage()) {
    return null;
  }

  const value = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

export const setAuthToken = (value: string) => {
  if (!canUseStorage()) {
    return;
  }

  const normalized = value.trim();
  if (!normalized) {
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, normalized);
};

export const clearAuthToken = () => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
};
