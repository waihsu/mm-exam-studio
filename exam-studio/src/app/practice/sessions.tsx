import { Redirect } from "expo-router";
import React from "react";
import { FullscreenLoading } from "@/features/app-shell/components/fullscreen-loading";
import { useAuthSessionQuery } from "@/features/auth/hooks/use-auth-session-query";
import { PracticeSessionsScreen } from "@/features/practice/components/practice-sessions-screen";

export default function PracticeSessionsRoute() {
  const sessionQuery = useAuthSessionQuery();

  if (sessionQuery.isLoading) {
    return <FullscreenLoading label="Checking session..." />;
  }

  if (!sessionQuery.data) {
    return <Redirect href="/sign-in" />;
  }

  return <PracticeSessionsScreen />;
}
