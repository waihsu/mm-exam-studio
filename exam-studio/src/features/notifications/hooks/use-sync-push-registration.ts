import { useEffect } from "react";
import { AppState } from "react-native";
import { syncExpoPushRegistration } from "../services/expo-push-registration.service";

const PUSH_SYNC_SUCCESS_COOLDOWN_MS = 6 * 60 * 60 * 1000;
const PUSH_SYNC_RETRY_COOLDOWN_MS = 5 * 60 * 1000;

let lastPushSyncAttemptAt = 0;
let lastPushSyncSuccessAt = 0;

export const useSyncPushRegistration = (enabled: boolean) => {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const shouldSkipSync = () => {
      const now = Date.now();
      if (
        lastPushSyncSuccessAt > 0 &&
        now - lastPushSyncSuccessAt < PUSH_SYNC_SUCCESS_COOLDOWN_MS
      ) {
        return true;
      }

      if (lastPushSyncAttemptAt > 0 && now - lastPushSyncAttemptAt < PUSH_SYNC_RETRY_COOLDOWN_MS) {
        return true;
      }

      return false;
    };

    const sync = async (force = false) => {
      if (!force && shouldSkipSync()) {
        return;
      }

      lastPushSyncAttemptAt = Date.now();

      await syncExpoPushRegistration()
        .then((result) => {
          if (result.registered) {
            lastPushSyncSuccessAt = Date.now();
          }
        })
        .catch((error) => {
          console.warn(
            `[push] registration sync failed: ${
              error instanceof Error ? error.message : "unknown error"
            }`,
          );
        });
    };

    void sync();

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void sync();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [enabled]);
};
