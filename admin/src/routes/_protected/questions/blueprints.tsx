import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/questions/blueprints")({
  component: BlueprintsLayout,
});

function BlueprintsLayout() {
  return <Outlet />;
}
