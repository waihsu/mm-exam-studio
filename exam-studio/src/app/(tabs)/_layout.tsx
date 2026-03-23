import { Redirect, Tabs } from "expo-router";
import React from "react";
import { Text } from "react-native";
import { FullscreenLoading } from "@/features/app-shell/components/fullscreen-loading";
import { useAuthSessionAutoRefresh } from "@/features/auth/hooks/use-auth-session-auto-refresh";
import { useAuthSessionQuery } from "@/features/auth/hooks/use-auth-session-query";
import { useSyncPushRegistration } from "@/features/notifications/hooks/use-sync-push-registration";
import { useMySupportConversationRealtime } from "@/features/support/hooks/use-my-support-conversation-realtime";

const TabIcon = ({ icon, color }: { icon: string; color: string }) => (
  <Text style={{ color, fontSize: 15 }}>{icon}</Text>
);

export default function TabsLayout() {
  const sessionQuery = useAuthSessionQuery();
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
          height: 62,
          paddingBottom: 6,
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <TabIcon icon="🏠" color={color} />,
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: "Practice",
          tabBarIcon: ({ color }) => <TabIcon icon="✍️" color={color} />,
        }}
      />
      <Tabs.Screen
        name="papers"
        options={{
          title: "Papers",
          tabBarIcon: ({ color }) => <TabIcon icon="📝" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <TabIcon icon="⚙️" color={color} />,
        }}
      />
    </Tabs>
  );
}
