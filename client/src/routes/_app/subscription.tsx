import { createFileRoute } from "@tanstack/react-router";
import { OpenAccessPage } from "@/features/open-access/components/open-access-page";

export const Route = createFileRoute("/_app/subscription")({
  component: OpenAccessPage,
});
