import { createFileRoute } from "@tanstack/react-router";
import { SecuritySettingsPage } from "@/features/settings/pages/security-settings-page";

export const Route = createFileRoute("/_protected/settings/security")({
  component: SecuritySettingsPage,
});
