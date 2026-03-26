import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { FileSpreadsheet, Plus } from "lucide-react";
import { PageContainer } from "@/components/page-container";
import { AdminPageHeader } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { ADMIN_ROUTES } from "@/constants/routes";

export const Route = createFileRoute("/_protected/questions")({
  component: QuestionsLayout,
});

function QuestionsLayout() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const isBlueprintRoute =
    pathname === ADMIN_ROUTES.questionBlueprints ||
    pathname.startsWith(`${ADMIN_ROUTES.questionBlueprints}/`);

  return (
    <PageContainer className="space-y-4 sm:space-y-5">
      <AdminPageHeader
        eyebrow="Question Bank"
        title={isBlueprintRoute ? "Blueprint workspace" : "Question workspace"}
        description={
          isBlueprintRoute
            ? "Manage reusable generation rules, template publishing, and preview-ready paper structures."
            : "Manage authored questions, imports, and publication-ready question bank content."
        }
        actions={
          !isBlueprintRoute ? (
            <>
              <Button
                asChild
                variant="outline"
                className="w-full border-slate-300/80 bg-white sm:w-auto"
              >
                <Link to={ADMIN_ROUTES.questionsImport}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Import CSV
                </Link>
              </Button>
              <Button asChild className="w-full sm:w-auto">
                <Link to={ADMIN_ROUTES.questionsNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  New question
                </Link>
              </Button>
            </>
          ) : null
        }
      />

      <Outlet />
    </PageContainer>
  );
}
