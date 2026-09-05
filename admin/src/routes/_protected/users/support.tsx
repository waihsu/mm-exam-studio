import { createFileRoute } from "@tanstack/react-router";
import {
  AdminSupportInboxPage,
  type SupportInboxSearch,
} from "@/features/support/pages/admin-support-inbox-page";

export const Route = createFileRoute("/_protected/users/support")({
  validateSearch: (search): SupportInboxSearch => ({
    search: typeof search.search === "string" ? search.search : undefined,
    status:
      search.status === "open" || search.status === "closed" || search.status === "all"
        ? search.status
        : undefined,
    conversationId:
      typeof search.conversationId === "string" ? search.conversationId : undefined,
  }),
  component: UserSupportInboxRoute,
});

function UserSupportInboxRoute() {
  return <AdminSupportInboxPage routeSearch={Route.useSearch()} />;
}
