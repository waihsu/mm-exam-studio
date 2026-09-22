import { createFileRoute } from "@tanstack/react-router";
import { BlueprintBuilderPage } from "@/features/blueprints/pages/blueprints-workspace";

export const Route = createFileRoute("/_protected/questions/blueprints/new")({
  component: NewBlueprintRoute,
});

function NewBlueprintRoute() {
  return <BlueprintBuilderPage />;
}
