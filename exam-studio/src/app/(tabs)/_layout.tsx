import { Redirect, Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FullscreenLoading } from "@/features/app-shell/components/fullscreen-loading";
import { useAuthSessionAutoRefresh } from "@/features/auth/hooks/use-auth-session-auto-refresh";
import { useAuthSessionQuery } from "@/features/auth/hooks/use-auth-session-query";
import { useSyncPushRegistration } from "@/features/notifications/hooks/use-sync-push-registration";
import { useMySupportConversationRealtime } from "@/features/support/hooks/use-my-support-conversation-realtime";
import { useTranslation } from "@/i18n";

const TabIcon = ({
  icon,
  color,
}: {
  icon: React.ComponentProps<typeof SymbolView>["name"];
  color: string;
}) => (
  <SymbolView name={icon} size={20} tintColor={color} weight="semibold" />
);

export default function TabsLayout() {
  const { t } = useTranslation("common");
  const sessionQuery = useAuthSessionQuery();
  const insets = useSafeAreaInsets();
  useAuthSessionAutoRefresh();
  useSyncPushRegistration(Boolean(sessionQuery.data));
  useMySupportConversationRealtime(Boolean(sessionQuery.data), {
    notifyOnAdminReply: true,
  });

  if (sessionQuery.isLoading) {
    return <FullscreenLoading label="Loading app..." />;
  }

  if (!sessionQuery.data) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#64748B",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#D8DEE9",
          height: 56 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t("navigation.home"),
          tabBarIcon: ({ color }) => (
            <TabIcon
              icon={{ ios: "house.fill", android: "home", web: "home" }}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: t("navigation.practice"),
          tabBarIcon: ({ color }) => (
            <TabIcon
              icon={{
                ios: "square.and.pencil",
                android: "edit_square",
                web: "edit_square",
              }}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="papers"
        options={{
          title: t("navigation.papers"),
          tabBarIcon: ({ color }) => (
            <TabIcon
              icon={{
                ios: "doc.text.fill",
                android: "description",
                web: "description",
              }}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("navigation.settings"),
          tabBarIcon: ({ color }) => (
            <TabIcon
              icon={{
                ios: "gearshape.fill",
                android: "settings",
                web: "settings",
              }}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
