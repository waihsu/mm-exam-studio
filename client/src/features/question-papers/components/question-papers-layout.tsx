import { Link, Outlet, useLocation } from "@tanstack/react-router";

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
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Link to="/question-papers" className="font-semibold text-slate-600 hover:text-slate-900">
              Question Papers
            </Link>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-slate-900">New paper</span>
          </div>
        </div>
      ) : null}
      <Outlet />
    </div>
  );
}
