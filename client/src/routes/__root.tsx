import { Suspense, lazy } from "react";
import { createRootRoute, Outlet } from "@tanstack/react-router";

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
});
