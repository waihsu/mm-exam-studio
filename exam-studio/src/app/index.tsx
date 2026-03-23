import React from "react";
import { Redirect, type RelativePathString } from "expo-router";
import { useAuthSessionQuery } from "@/features/auth/hooks/use-auth-session-query";
import { FullscreenLoading } from "@/features/app-shell/components/fullscreen-loading";

export default function HomeScreen() {
  const sessionQuery = useAuthSessionQuery();

  if (sessionQuery.isLoading) {
    return <FullscreenLoading label="Checking session..." />;
  }

  if (!sessionQuery.data) {
    return <Redirect href="/sign-in" />;
  }

  return <Redirect href={"/home" as RelativePathString} />;
}
