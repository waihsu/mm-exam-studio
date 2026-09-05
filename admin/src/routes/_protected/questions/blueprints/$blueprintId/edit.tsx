import { createFileRoute } from "@tanstack/react-router";
import { BlueprintBuilderPage } from "@/features/blueprints/pages/blueprints-workspace";

export const Route = createFileRoute("/_protected/questions/blueprints/$blueprintId/edit")({
  component: EditBlueprintRoute,
});

function EditBlueprintRoute() {
  const { blueprintId } = Route.useParams();
  return <BlueprintBuilderPage blueprintId={blueprintId} />;
}
