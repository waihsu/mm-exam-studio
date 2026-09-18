import { Suspense, lazy } from "react";
import { Link, createRootRoute, Outlet } from "@tanstack/react-router";
import { ArrowLeft, RefreshCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

const RouterDevtools = import.meta.env.DEV
  ? lazy(async () => {
      const module = await import("@tanstack/react-router-devtools");
      return { default: module.TanStackRouterDevtools };
    })
  : null;

export const Route = createRootRoute({
	component: () => (
			<div className="min-h-screen bg-transparent text-slate-950">
				<Outlet />
				{RouterDevtools ? (
					<Suspense fallback={null}>
						<RouterDevtools />
					</Suspense>
				) : null}
			</div>
		),
	notFoundComponent: MissingRoute,
	errorComponent: AppError,
});

function MissingRoute() {
	return (
		<main className="grid min-h-screen place-items-center bg-[#f7f8fa] p-5">
			<section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-[0_24px_55px_-40px_rgba(15,23,42,0.42)] sm:p-9">
				<p className="ui-kicker text-indigo-700">Route unavailable</p>
				<h1 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-slate-950">This page is not in your workspace.</h1>
				<p className="mt-3 text-sm leading-7 text-slate-600">The link may be old, or the page may have moved. Return to your study space and continue from there.</p>
				<Button asChild className="mt-7 rounded-xl"><Link to="/dashboard"><ArrowLeft className="h-4 w-4" /> Back to dashboard</Link></Button>
			</section>
		</main>
	);
}

function AppError() {
	return (
		<main className="grid min-h-screen place-items-center bg-[#f7f8fa] p-5">
			<section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-[0_24px_55px_-40px_rgba(15,23,42,0.42)] sm:p-9">
				<span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><TriangleAlert className="h-5 w-5" /></span>
				<p className="ui-kicker mt-5 text-indigo-700">Temporary interruption</p>
				<h1 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-slate-950">We could not open this view.</h1>
				<p className="mt-3 text-sm leading-7 text-slate-600">Your saved practice and papers are not changed. Try reloading, then return to the dashboard if the issue continues.</p>
				<div className="mt-7 flex flex-wrap justify-center gap-3">
					<Button className="rounded-xl" onClick={() => window.location.reload()}><RefreshCcw className="h-4 w-4" /> Reload page</Button>
					<Button asChild variant="outline" className="rounded-xl bg-white"><Link to="/dashboard">Dashboard</Link></Button>
				</div>
			</section>
		</main>
	);
}
