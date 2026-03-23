import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ShieldCheck, Sparkles, User2 } from "lucide-react";
import studyAppLogo from "@/assets/study-app-logo.svg";
import { Button } from "@/components/ui/button";
import { loadAppAuthSnapshot } from "@/features/auth/utils/app-auth";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const meQuery = useQuery({
    queryKey: ["client-user-snapshot"],
    queryFn: () => loadAppAuthSnapshot(),
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe_0%,#f8fafc_44%,#fff7ed_100%)]">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-10 px-6 py-16">
        <div className="flex items-center gap-4">
          <img src={studyAppLogo} className="h-20 w-20" alt="Study app logo" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
              Subscription Workspace
            </p>
            <h1 className="text-5xl font-black tracking-tight text-slate-950">
              MM Exam Studio
            </h1>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.8fr)]">
          <div className="space-y-6">
            <h2 className="max-w-3xl text-3xl font-black leading-tight text-slate-900 sm:text-5xl">
              Practice anytime, build question papers, and export PDF files
              inside one subscription-based workspace.
            </h2>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              This user app is being rebuilt feature-by-feature on top of real
              backend auth. The first connected slice is account access,
              dashboard, profile, and settings.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to={meQuery.data?.user ? "/dashboard" : "/signin"}>
                  {meQuery.data?.user ? "Open dashboard" : "Sign in"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="bg-white">
                <Link to="/signup">Create account</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl border border-white/80 bg-white/80 p-6 shadow-sm backdrop-blur">
              <div className="flex items-center gap-3">
                <User2 className="h-5 w-5 text-sky-700" />
                <h3 className="text-lg font-bold text-slate-900">Account First</h3>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                No fake demo cards anymore. The app now starts from your real
                signed-in account and grows outward from there.
              </p>
            </div>
            <div className="rounded-3xl border border-white/80 bg-white/80 p-6 shadow-sm backdrop-blur">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-emerald-700" />
                <h3 className="text-lg font-bold text-slate-900">Incremental Build</h3>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Practice, question papers, and subscription screens
                stay in the route tree, but they now clearly show which backend
                slice we need next.
              </p>
            </div>
            <div className="rounded-3xl border border-white/80 bg-white/80 p-6 shadow-sm backdrop-blur">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-amber-700" />
                <h3 className="text-lg font-bold text-slate-900">No Role Split</h3>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                This app is capability-based, not student-versus-teacher. We
                will wire subscription and usage limits directly to features.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Index;
