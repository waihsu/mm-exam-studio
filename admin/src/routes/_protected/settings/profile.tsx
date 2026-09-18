import { createFileRoute } from "@tanstack/react-router";
import { ProfileSettingsPage } from "@/features/settings/pages/profile-settings-page";

export const Route = createFileRoute("/_protected/settings/profile")({
  component: ProfileSettingsPage,
});
