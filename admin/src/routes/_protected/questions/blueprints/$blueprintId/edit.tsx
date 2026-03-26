import { createFileRoute } from "@tanstack/react-router";
import { BlueprintBuilderPage } from "@/routes/_protected/questions/blueprints";

export const Route = createFileRoute("/_protected/questions/blueprints/$blueprintId/edit")({
  component: EditBlueprintRoute,
});

function EditBlueprintRoute() {
  const { blueprintId } = Route.useParams();
  return <BlueprintBuilderPage blueprintId={blueprintId} />;
}
