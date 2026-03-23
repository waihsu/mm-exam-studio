import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { FileSpreadsheet, Plus } from "lucide-react";
import { PageContainer } from "@/components/page-container";
import { Button } from "@/components/ui/button";
import { ADMIN_ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Question list", to: ADMIN_ROUTES.questions },
  { label: "New question", to: ADMIN_ROUTES.questionsNew },
  { label: "Import CSV", to: ADMIN_ROUTES.questionsImport },
] as const;

export const Route = createFileRoute("/_protected/questions")({
  component: QuestionsLayout,
});

function QuestionsLayout() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <PageContainer className="space-y-4 sm:space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Question Bank
          </p>
          <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
            Question workspace
          </h1>
        </div>

        <div className="flex flex-col gap-3 lg:items-end">
          <div className="overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-max gap-2">
              {tabs.map((tab) => {
                const isActive =
                  pathname === tab.to || pathname.startsWith(`${tab.to}/`);

                return (
                  <Button
                    key={tab.to}
                    asChild
                    variant="outline"
                    className={cn(
                      "border-slate-300/80 bg-white",
                      isActive &&
                        "border-slate-900 bg-slate-900 text-white hover:bg-slate-900",
                    )}
                  >
                    <Link to={tab.to}>{tab.label}</Link>
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:justify-items-end">
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
          </div>
        </div>
      </div>

      <Outlet />
    </PageContainer>
  );
}
