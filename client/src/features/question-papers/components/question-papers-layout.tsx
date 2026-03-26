import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { SectionCard } from "@/components/ui/page-shell";

export function QuestionPapersLayout() {
  const location = useLocation();
  const isListRoute =
    location.pathname === "/question-papers" || location.pathname === "/question-papers/";
  const isNewRoute = location.pathname === "/question-papers/new";

  if (isListRoute) {
    return <Outlet />;
  }

  return (
    <div className="space-y-5">
      {isNewRoute ? (
        <SectionCard title="Question Papers">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Link to="/question-papers" className="font-semibold text-slate-600 hover:text-slate-900">
              Question Papers
            </Link>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-slate-900">New paper</span>
          </div>
        </SectionCard>
      ) : null}
      <Outlet />
    </div>
  );
}
