import React from "react";
import { Redirect, type RelativePathString } from "expo-router";
import { FullscreenLoading } from "@/features/app-shell/components/fullscreen-loading";
import { ForgotPasswordScreen } from "@/features/auth/components/forgot-password-screen";
import { useAuthSessionQuery } from "@/features/auth/hooks/use-auth-session-query";

export default function ForgotPasswordRoute() {
  const sessionQuery = useAuthSessionQuery();

  if (sessionQuery.isLoading) {
    return <FullscreenLoading label="Preparing password reset..." />;
  }

  if (sessionQuery.data) {
    return <Redirect href={"/home" as RelativePathString} />;
  }

  return <ForgotPasswordScreen />;
}
