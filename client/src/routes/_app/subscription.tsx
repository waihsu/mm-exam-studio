import { createFileRoute } from "@tanstack/react-router";
import { SubscriptionPage } from "@/features/subscription/components/subscription-page";

export const Route = createFileRoute("/_app/subscription")({
  component: SubscriptionPage,
});
