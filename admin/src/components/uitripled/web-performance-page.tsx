import { useMemo, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWebPerformance } from "@/features/performance/hooks/use-web-performance";
import type { MetricStatus } from "@/features/performance/types";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Layout,
  RefreshCcw,
  Timer,
  Zap,
} from "lucide-react";

type WebPerformancePageProps = {
  layout?: "default" | "wide" | "full";
};

type VitalCardProps = {
  label: string;
  value: number | null;
  unit: string;
  latestValue: number | null;
  description: string;
  status: MetricStatus;
};

const containerClassMap: Record<NonNullable<WebPerformancePageProps["layout"]>, string> = {
  default: "max-w-7xl",
  wide: "max-w-[1600px]",
  full: "max-w-none",
};

const statusClassMap: Record<MetricStatus, string> = {
  good: "text-emerald-700 border-emerald-300 bg-emerald-50",
  "needs-improvement": "text-amber-700 border-amber-300 bg-amber-50",
  poor: "text-red-700 border-red-300 bg-red-50",
  unknown: "text-slate-700 border-slate-300 bg-slate-100",
};

const statusIconMap: Record<MetricStatus, ReactNode> = {
  good: <CheckCircle2 className="h-3.5 w-3.5" />,
  "needs-improvement": <AlertCircle className="h-3.5 w-3.5" />,
  poor: <AlertCircle className="h-3.5 w-3.5" />,
  unknown: <Timer className="h-3.5 w-3.5" />,
};

const toStatusLabel = (status: MetricStatus) =>
  status === "needs-improvement"
    ? "Needs Improvement"
    : status.charAt(0).toUpperCase() + status.slice(1);

const formatMs = (value: number | null) =>
  value === null ? "--" : value >= 1000 ? `${(value / 1000).toFixed(2)}s` : `${Math.round(value)}ms`;

const formatNumber = (value: number | null, fractionDigits = 2) =>
  value === null ? "--" : value.toFixed(fractionDigits);

const formatBytes = (bytes: number | null) => {
  if (bytes === null) return "--";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatDateTime = (value: string | null) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString();
};

function VitalCard({
  label,
  value,
  latestValue,
  unit,
  description,
  status,
}: VitalCardProps) {
  const formattedValue = unit === "cls" ? formatNumber(value, 3) : formatMs(value);
  const formattedLatest = unit === "cls" ? formatNumber(latestValue, 3) : formatMs(latestValue);

  return (
    <section className="rounded-2xl border border-slate-300/70 bg-white/90 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">{formattedValue}</p>
          <p className="mt-1 text-xs text-slate-500">p75 value</p>
        </div>
        <Badge className={cn("border", statusClassMap[status])}>
          {statusIconMap[status]}
          {toStatusLabel(status)}
        </Badge>
      </div>
      <p className="mt-3 text-xs text-slate-500">Latest: {formattedLatest}</p>
      <p className="mt-1 text-xs text-slate-600">{description}</p>
    </section>
  );
}

export function WebPerformancePage({ layout = "default" }: WebPerformancePageProps) {
  const { summary, isLoading, isRunningAudit, errorMessage, loadSummary, runAudit } =
    useWebPerformance();

  const resourceTypeRows = useMemo(() => {
    const byType = summary?.resources.byType;
    if (!byType) {
      return [] as Array<{ label: string; bytes: number }>;
    }

    return [
      { label: "JavaScript", bytes: byType.jsBytes },
      { label: "CSS", bytes: byType.cssBytes },
      { label: "Images", bytes: byType.imageBytes },
      { label: "Fonts", bytes: byType.fontBytes },
      { label: "Other", bytes: byType.otherBytes },
    ];
  }, [summary?.resources.byType]);

  const scoreRing = summary?.score.p75 ?? summary?.score.average ?? summary?.score.latest ?? null;

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-foreground/[0.035] blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-foreground/[0.025] blur-[120px]" />
      </div>

      <div className="relative px-6 py-8 lg:px-10 lg:py-12">
        <div className={cn("mx-auto w-full space-y-6", containerClassMap[layout])}>
          <header className="rounded-3xl border border-slate-300/70 bg-white/90 p-5 shadow-sm md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <Badge variant="outline" className="w-fit border-slate-300 bg-white text-slate-700">
                  {summary?.sampleCount ? `${summary.sampleCount} samples` : "No samples yet"}
                </Badge>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                  Web Performance
                </h1>
                <p className="text-sm text-slate-600">
                  Real browser metrics from admin app clients, stored and aggregated by backend APIs.
                </p>
                <p className="text-xs text-slate-500">
                  Last captured: {formatDateTime(summary?.lastCapturedAt ?? null)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="border-slate-300 bg-white"
                  onClick={() => {
                    void loadSummary();
                  }}
                  disabled={isLoading}
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  {isLoading ? "Refreshing..." : "Refresh"}
                </Button>
                <Button
                  className="bg-slate-900 text-white hover:bg-slate-800"
                  onClick={() => {
                    void runAudit();
                  }}
                  disabled={isRunningAudit}
                >
                  {isRunningAudit ? "Running Audit..." : "Run Audit"}
                </Button>
              </div>
            </div>

            {errorMessage ? (
              <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage}
              </p>
            ) : null}
          </header>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <VitalCard
              label="Largest Contentful Paint"
              value={summary?.vitals.lcp.p75Ms ?? null}
              latestValue={summary?.vitals.lcp.latestMs ?? null}
              unit="ms"
              description="Main content render speed"
              status={summary?.vitals.lcp.status ?? "unknown"}
            />
            <VitalCard
              label="First Input Delay"
              value={summary?.vitals.fid.p75Ms ?? null}
              latestValue={summary?.vitals.fid.latestMs ?? null}
              unit="ms"
              description="First interaction delay"
              status={summary?.vitals.fid.status ?? "unknown"}
            />
            <VitalCard
              label="Interaction to Next Paint"
              value={summary?.vitals.inp.p75Ms ?? null}
              latestValue={summary?.vitals.inp.latestMs ?? null}
              unit="ms"
              description="Interaction responsiveness"
              status={summary?.vitals.inp.status ?? "unknown"}
            />
            <VitalCard
              label="Cumulative Layout Shift"
              value={summary?.vitals.cls.p75 ?? null}
              latestValue={summary?.vitals.cls.latest ?? null}
              unit="cls"
              description="Visual stability"
              status={summary?.vitals.cls.status ?? "unknown"}
            />
          </section>

          <section className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
            <div className="rounded-2xl border border-slate-300/70 bg-white/90 p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Performance Score</p>
              <p className="mt-2 text-5xl font-black tracking-tight text-slate-900">
                {scoreRing === null ? "--" : Math.round(scoreRing)}
              </p>
              <Badge className={cn("mt-3 border", statusClassMap[summary?.score.status ?? "unknown"])}>
                {statusIconMap[summary?.score.status ?? "unknown"]}
                {toStatusLabel(summary?.score.status ?? "unknown")}
              </Badge>

              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-slate-600">Latest</dt>
                  <dd className="font-semibold text-slate-900">{formatNumber(summary?.score.latest ?? null, 0)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-slate-600">Average</dt>
                  <dd className="font-semibold text-slate-900">{formatNumber(summary?.score.average ?? null, 1)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-slate-600">p75</dt>
                  <dd className="font-semibold text-slate-900">{formatNumber(summary?.score.p75 ?? null, 1)}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-slate-300/70 bg-white/90 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-900">Resource Breakdown</h2>
                <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">
                  {summary?.resources.totalRequests ?? 0} requests
                </Badge>
              </div>

              <p className="mt-2 text-sm text-slate-600">
                Total transfer: {formatBytes(summary?.resources.totalTransferBytes ?? null)}
              </p>

              <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                {resourceTypeRows.map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">{item.label}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{formatBytes(item.bytes)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-2">
                <p className="text-sm font-semibold text-slate-900">Slowest Resources</p>
                {summary?.resources.slowest.length ? (
                  summary.resources.slowest.map((resource) => (
                    <div
                      key={`${resource.name}-${resource.initiatorType}`}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">{resource.name}</p>
                        <p className="text-xs text-slate-500">
                          {resource.initiatorType} • {resource.samples} samples
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">
                          {formatMs(resource.averageDurationMs)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatBytes(resource.averageTransferSizeBytes)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                    No resource samples yet. Run audit to collect data.
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-300/70 bg-white/90 p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">Trend (last buckets)</h2>
            <p className="mt-1 text-sm text-slate-600">
              15-minute grouped trend of score and core metrics.
            </p>

            {summary?.timeline.length ? (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-2">Bucket</th>
                      <th className="px-2">Samples</th>
                      <th className="px-2">Avg Score</th>
                      <th className="px-2">p75 LCP</th>
                      <th className="px-2">p75 INP</th>
                      <th className="px-2">p75 CLS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.timeline.map((row) => (
                      <tr key={row.bucketStart} className="rounded-xl border border-slate-200 bg-slate-50 text-slate-800">
                        <td className="rounded-l-xl px-2 py-2">{formatDateTime(row.bucketStart)}</td>
                        <td className="px-2 py-2">{row.sampleCount}</td>
                        <td className="px-2 py-2">{formatNumber(row.averageScore, 1)}</td>
                        <td className="px-2 py-2">{formatMs(row.p75LcpMs)}</td>
                        <td className="px-2 py-2">{formatMs(row.p75InpMs)}</td>
                        <td className="rounded-r-xl px-2 py-2">{formatNumber(row.p75Cls, 3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                No trend data yet.
              </p>
            )}
          </section>

          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-slate-300/70 bg-white/90 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-800">
                <Layout className="h-4 w-4" />
                <p className="font-semibold">LCP</p>
              </div>
              <p className="mt-2 text-sm text-slate-600">Optimize hero assets and reduce render-blocking resources.</p>
            </article>
            <article className="rounded-2xl border border-slate-300/70 bg-white/90 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-800">
                <Zap className="h-4 w-4" />
                <p className="font-semibold">INP / FID</p>
              </div>
              <p className="mt-2 text-sm text-slate-600">Split long tasks and keep interaction handlers lightweight.</p>
            </article>
            <article className="rounded-2xl border border-slate-300/70 bg-white/90 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-800">
                <Activity className="h-4 w-4" />
                <p className="font-semibold">CLS</p>
              </div>
              <p className="mt-2 text-sm text-slate-600">Reserve space for media and avoid late layout shifts.</p>
            </article>
            <article className="rounded-2xl border border-slate-300/70 bg-white/90 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-800">
                <Timer className="h-4 w-4" />
                <p className="font-semibold">TTFB</p>
              </div>
              <p className="mt-2 text-sm text-slate-600">Use caching and edge delivery to reduce server wait time.</p>
            </article>
          </section>
        </div>
      </div>
    </main>
  );
}
