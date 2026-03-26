import { createFileRoute } from "@tanstack/react-router";
import { BlueprintListPage } from "@/routes/_protected/questions/blueprints";

export const Route = createFileRoute("/_protected/questions/blueprints/")({
  component: BlueprintIndexRoute,
});

function BlueprintIndexRoute() {
  return <BlueprintListPage />;
}
