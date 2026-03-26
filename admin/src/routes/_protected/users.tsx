import { Outlet } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/page-container";

export const Route = createFileRoute("/_protected/users")({
  component: UsersLayout,
});

function UsersLayout() {
  return (
    <PageContainer className="space-y-4 sm:space-y-5">
      <Outlet />
    </PageContainer>
  );
}
