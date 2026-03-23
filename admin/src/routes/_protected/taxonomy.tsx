import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Layers3 } from "lucide-react";
import { PageContainer, PagePanel } from "@/components/page-container";
import { Button } from "@/components/ui/button";
import { ADMIN_ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Grades", to: ADMIN_ROUTES.taxonomyGrades },
  { label: "Subjects", to: ADMIN_ROUTES.taxonomySubjects },
  { label: "Chapters", to: ADMIN_ROUTES.taxonomyChapters },
  { label: "Sub Chapters", to: ADMIN_ROUTES.taxonomySubChapters },
] as const;

export const Route = createFileRoute("/_protected/taxonomy")({
  beforeLoad: ({ location }) => {
    if (location.pathname === ADMIN_ROUTES.taxonomy) {
      throw redirect({ to: ADMIN_ROUTES.taxonomyGrades });
    }
  },
  component: TaxonomyLayout,
});

function TaxonomyLayout() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <PageContainer className="space-y-4 sm:space-y-5">
      <PagePanel className="space-y-5 bg-white/88">
        <div className="space-y-4 lg:flex lg:items-end lg:justify-between lg:space-y-0">
          <div className="space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <Layers3 className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                Taxonomy Control
              </p>
              <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
                Grade, subject, chapter, and sub chapter routes
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-600">
                The database centers the question bank around taxonomy. These
                nested admin routes match that structure directly so control
                panels stay aligned with `Grade`, `Subject`, `Chapter`, and
                `SubChapter` tables.
              </p>
            </div>
          </div>
        </div>

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
                    isActive && "border-slate-900 bg-slate-900 text-white hover:bg-slate-900",
                  )}
                >
                  <Link to={tab.to}>{tab.label}</Link>
                </Button>
              );
            })}
          </div>
        </div>
      </PagePanel>
      <Outlet />
    </PageContainer>
  );
}
