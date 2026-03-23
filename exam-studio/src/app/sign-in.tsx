import React from "react";
import { Redirect, type RelativePathString } from "expo-router";
import { FullscreenLoading } from "@/features/app-shell/components/fullscreen-loading";
import { useAuthSessionQuery } from "@/features/auth/hooks/use-auth-session-query";
import { SignInScreen } from "@/features/auth/components/sign-in-screen";

export default function SignInRoute() {
  const sessionQuery = useAuthSessionQuery();

  if (sessionQuery.isLoading) {
    return <FullscreenLoading label="Preparing sign in..." />;
  }

  if (sessionQuery.data) {
    return <Redirect href={"/home" as RelativePathString} />;
  }

  return <SignInScreen />;
}
