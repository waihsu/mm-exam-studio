import { Redirect, useLocalSearchParams } from "expo-router";
import React from "react";
import { Text } from "react-native";
import { AppShell } from "@/features/app-shell/components/app-shell";
import { FullscreenLoading } from "@/features/app-shell/components/fullscreen-loading";
import { useAuthSessionQuery } from "@/features/auth/hooks/use-auth-session-query";
import { PracticeSessionScreen } from "@/features/practice/components/practice-session-screen";

export default function PracticeSessionRoute() {
  const sessionQuery = useAuthSessionQuery();
  const params = useLocalSearchParams<{ sessionId?: string | string[] }>();
  const sessionId =
    typeof params.sessionId === "string"
      ? params.sessionId
      : Array.isArray(params.sessionId)
        ? params.sessionId[0]
        : "";

  if (sessionQuery.isLoading) {
    return <FullscreenLoading label="Checking session..." />;
  }

  if (!sessionQuery.data) {
    return <Redirect href="/sign-in" />;
  }

  if (!sessionId || sessionId.trim().length === 0) {
    return (
      <AppShell>
        <Text>Invalid practice session id.</Text>
      </AppShell>
    );
  }

  return <PracticeSessionScreen sessionId={sessionId} />;
}

