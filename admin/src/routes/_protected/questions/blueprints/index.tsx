import { createFileRoute } from "@tanstack/react-router";
import { BlueprintListPage } from "@/features/blueprints/pages/blueprints-workspace";

export const Route = createFileRoute("/_protected/questions/blueprints/")({
  component: BlueprintIndexRoute,
});

function BlueprintIndexRoute() {
  return <BlueprintListPage />;
}
