import { createFileRoute } from "@tanstack/react-router";
import { SupportPage } from "@/features/support/components/support-page";

export const Route = createFileRoute("/_app/support")({
  component: SupportPage,
});
