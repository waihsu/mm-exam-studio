import { Redirect, type RelativePathString } from "expo-router";
import React from "react";
import { FullscreenLoading } from "@/features/app-shell/components/fullscreen-loading";
import { MfaScreen } from "@/features/auth/components/mfa-screen";
import { useAuthSessionQuery } from "@/features/auth/hooks/use-auth-session-query";

export default function MfaRoute() {
  const sessionQuery = useAuthSessionQuery();

  if (sessionQuery.isLoading) {
    return <FullscreenLoading label="Preparing verification..." />;
  }

  if (sessionQuery.data) {
    return <Redirect href={"/home" as RelativePathString} />;
  }

  return <MfaScreen />;
}
