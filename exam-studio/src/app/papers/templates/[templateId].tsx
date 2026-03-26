import { Redirect, useLocalSearchParams } from "expo-router";
import React from "react";
import { Text } from "react-native";
import { AppShell } from "@/features/app-shell/components/app-shell";
import { FullscreenLoading } from "@/features/app-shell/components/fullscreen-loading";
import { useAuthSessionQuery } from "@/features/auth/hooks/use-auth-session-query";
import { PaperTemplateDetailScreen } from "@/features/papers/components/paper-template-detail-screen";

export default function PaperTemplateDetailRoute() {
  const sessionQuery = useAuthSessionQuery();
  const params = useLocalSearchParams<{ templateId?: string | string[] }>();
  const templateId =
    typeof params.templateId === "string"
      ? params.templateId
      : Array.isArray(params.templateId)
        ? params.templateId[0]
        : "";

  if (sessionQuery.isLoading) {
    return <FullscreenLoading label="Checking session..." />;
  }

  if (!sessionQuery.data) {
    return <Redirect href="/sign-in" />;
  }

  if (!templateId || templateId.trim().length === 0) {
    return (
      <AppShell>
        <Text>Invalid paper template id.</Text>
      </AppShell>
    );
  }

  return <PaperTemplateDetailScreen templateId={templateId} />;
}
