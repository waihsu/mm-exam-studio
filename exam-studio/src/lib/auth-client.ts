import * as SecureStore from "expo-secure-store";
import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import { getAuthToken } from "./auth-token-store";
import { API_BASE_URL } from "./config";

export const authClient = createAuthClient({
  baseURL: `${API_BASE_URL}/api/auth`,
  plugins: [
    expoClient({
      scheme: "examstudio",
      storage: SecureStore,
      storagePrefix: "exam-studio",
      cookiePrefix: "better-auth",
    }),
  ],
  fetchOptions: {
    credentials: "include",
    auth: {
      type: "Bearer",
      token: async () => {
        const token = await getAuthToken();
        return token ?? undefined;
      },
    },
  },
});
