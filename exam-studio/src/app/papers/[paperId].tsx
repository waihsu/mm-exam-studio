import { Redirect, useLocalSearchParams } from "expo-router";
import React from "react";
import { Text } from "react-native";
import { AppShell } from "@/features/app-shell/components/app-shell";
import { FullscreenLoading } from "@/features/app-shell/components/fullscreen-loading";
import { useAuthSessionQuery } from "@/features/auth/hooks/use-auth-session-query";
import { PaperDetailScreen } from "@/features/papers/components/paper-detail-screen";

export default function QuestionPaperDetailRoute() {
  const sessionQuery = useAuthSessionQuery();
  const params = useLocalSearchParams<{ paperId?: string | string[] }>();
  const paperId =
    typeof params.paperId === "string"
      ? params.paperId
      : Array.isArray(params.paperId)
        ? params.paperId[0]
        : "";

  if (sessionQuery.isLoading) {
    return <FullscreenLoading label="Checking session..." />;
  }

  if (!sessionQuery.data) {
    return <Redirect href="/sign-in" />;
  }

  if (!paperId || paperId.trim().length === 0) {
    return (
      <AppShell>
        <Text>Invalid question paper id.</Text>
      </AppShell>
    );
  }

  return <PaperDetailScreen paperId={paperId} />;
}
