import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, FileSpreadsheet, Plus } from "lucide-react";
import { PageContainer } from "@/components/page-container";
import { AdminPageHeader } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { ADMIN_ROUTES } from "@/constants/routes";

export const Route = createFileRoute("/_protected/questions")({
  component: QuestionsLayout,
});

function QuestionsLayout() {
  const pathname = useRouterState({
    select: state => state.location.pathname,
  });
  const isBlueprintRoute =
    pathname === ADMIN_ROUTES.questionBlueprints ||
    pathname.startsWith(`${ADMIN_ROUTES.questionBlueprints}/`);
  const studyAppUrl = (
    import.meta.env.VITE_STUDY_APP_URL ?? "http://localhost:5173"
  )
    .trim()
    .replace(/\/+$/, "");

  return (
    <PageContainer className="space-y-4 sm:space-y-5">
      <AdminPageHeader
        eyebrow="Question Bank"
        title={
          isBlueprintRoute ? "Paper templates (advanced)" : "Question workspace"
        }
        description={
          isBlueprintRoute
            ? "For teams that repeatedly generate the same paper pattern. Most paper creation happens in Paper Studio."
            : "Create and review questions here, then open Paper Studio when you are ready to assemble a printable paper."
        }
        actions={
          !isBlueprintRoute ? (
            <>
              <Button
                asChild
                variant="outline"
                className="w-full border-slate-300/80 bg-white sm:w-auto"
              >
                <a
                  href={`${studyAppUrl}/question-papers/new`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Create paper
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
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
