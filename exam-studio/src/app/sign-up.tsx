import React from "react";
import { Redirect, type RelativePathString } from "expo-router";
import { FullscreenLoading } from "@/features/app-shell/components/fullscreen-loading";
import { SignUpScreen } from "@/features/auth/components/sign-up-screen";
import { useAuthSessionQuery } from "@/features/auth/hooks/use-auth-session-query";

export default function SignUpRoute() {
  const sessionQuery = useAuthSessionQuery();

  if (sessionQuery.isLoading) {
    return <FullscreenLoading label="Preparing account setup..." />;
  }

  if (sessionQuery.data) {
    return <Redirect href={"/home" as RelativePathString} />;
  }

  return <SignUpScreen />;
}
