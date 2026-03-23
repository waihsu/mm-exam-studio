import { Stack, router, type ErrorBoundaryProps } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import { SUBSCRIPTION_QUERY_KEYS } from "@/features/subscriptions/constants/query-keys";
import { SUPPORT_QUERY_KEYS } from "@/features/support/constants/query-keys";
import { WORKSPACE_QUERY_KEYS } from "@/features/workspace/constants/query-keys";
import { LaunchSplashScreen } from "@/features/app-shell/components/launch-splash-screen";
import { initializeAppNotifications } from "@/features/practice/services/practice-reminder-notification.service";
import { AppLanguageSync } from "@/i18n";
import { appQueryClient } from "@/lib/query-client";
import { QueryProvider } from "@/lib/query-provider";

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

const syncNotificationSideEffects = (data: unknown) => {
  if (!data || typeof data !== "object" || !("kind" in data)) {
    return;
  }

  if (data.kind === "support-reply") {
    void appQueryClient.invalidateQueries({
      queryKey: SUPPORT_QUERY_KEYS.myConversation(),
    });
    return;
  }

  if (data.kind === "subscription-request-reviewed") {
    void Promise.allSettled([
      appQueryClient.invalidateQueries({
        queryKey: WORKSPACE_QUERY_KEYS.summary(),
      }),
      appQueryClient.invalidateQueries({
        queryKey: SUBSCRIPTION_QUERY_KEYS.currentRequest(),
      }),
      appQueryClient.invalidateQueries({
        queryKey: SUBSCRIPTION_QUERY_KEYS.requests(),
      }),
    ]);
  }
};

const navigateFromNotification = (data: unknown) => {
  if (!data || typeof data !== "object" || !("kind" in data)) {
    return;
  }

  if (
    data.kind === "practice-reminder" &&
    "sessionId" in data &&
    typeof data.sessionId === "string" &&
    data.sessionId.trim().length > 0
  ) {
    router.push(`/practice/${data.sessionId}` as const);
    return;
  }

  if (data.kind === "support-reply") {
    router.push("/settings/support");
    return;
  }

  if (data.kind === "subscription-request-reviewed") {
    router.push("/settings/subscription");
  }
};

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <SafeAreaProvider>
      <View style={styles.errorRoot}>
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Unexpected App Error</Text>
          <Text style={styles.errorMessage}>
            {error?.message?.trim() || "Something went wrong while rendering this screen."}
          </Text>
          <Pressable style={({ pressed }) => [styles.errorButton, pressed && styles.errorButtonPressed]} onPress={retry}>
            <Text style={styles.errorButtonLabel}>Try Again</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  const [isLaunchReady, setIsLaunchReady] = useState(false);
  const [showLaunchOverlay, setShowLaunchOverlay] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const prepare = async () => {
      await initializeAppNotifications();
      if (isMounted) {
        setIsLaunchReady(true);
      }
    };

    void prepare();

    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      syncNotificationSideEffects(notification.request.content.data);
    });

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      syncNotificationSideEffects(data);
      navigateFromNotification(data);
    });

    return () => {
      isMounted = false;
      receivedSubscription.remove();
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!isLaunchReady) {
      return;
    }

    void SplashScreen.hideAsync().catch(() => undefined);
  }, [isLaunchReady]);

  return (
    <SafeAreaProvider>
      <QueryProvider>
        <AppLanguageSync />
        <StatusBar style={showLaunchOverlay ? "light" : "dark"} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#F4F6FA" },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="sign-in" />
          <Stack.Screen name="sign-up" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="reset-password" />
          <Stack.Screen name="email-verified" />
          <Stack.Screen name="mfa" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="practice/sessions" />
          <Stack.Screen name="practice/[sessionId]" />
          <Stack.Screen name="papers/[paperId]" />
        </Stack>
        {isLaunchReady && showLaunchOverlay ? (
          <LaunchSplashScreen onFinished={() => setShowLaunchOverlay(false)} />
        ) : null}
      </QueryProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  errorRoot: {
    alignItems: "center",
    backgroundColor: "#F4F6FA",
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  errorCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D8DEE9",
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    maxWidth: 420,
    padding: 16,
    width: "100%",
  },
  errorTitle: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "800",
  },
  errorMessage: {
    color: "#334155",
    fontSize: 14,
    lineHeight: 20,
  },
  errorButton: {
    alignItems: "center",
    backgroundColor: "#111827",
    borderRadius: 10,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 12,
  },
  errorButtonPressed: {
    opacity: 0.85,
  },
  errorButtonLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
