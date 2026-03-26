import { createFileRoute } from "@tanstack/react-router";
import { BlueprintBuilderPage } from "@/routes/_protected/questions/blueprints";

export const Route = createFileRoute("/_protected/questions/blueprints/new")({
  component: NewBlueprintRoute,
});

function NewBlueprintRoute() {
  return <BlueprintBuilderPage />;
}
