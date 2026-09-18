import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { PagePanel } from "@/components/page-container";
import { ADMIN_ROUTES } from "@/constants/routes";
import type { PaperBlueprintListRow } from "@/features/blueprints/types";

type DashboardBlueprintInventoryProps = {
  blueprints: PaperBlueprintListRow[];
  readyCount: number;
  publishedCount: number;
  draftCount: number;
};

const blueprintStatusClassName = (status: PaperBlueprintListRow["status"]) =>
  status === "ready"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : status === "draft"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-slate-200 bg-slate-100 text-slate-700";

export function DashboardBlueprintInventory({
  blueprints,
  readyCount,
  publishedCount,
  draftCount,
}: DashboardBlueprintInventoryProps) {
  return (
    <PagePanel className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="admin-kicker text-slate-500">Content health</p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">Blueprint inventory</h2>
        </div>
        <Badge
          className={
            draftCount > 0
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }
        >
          {draftCount} need setup
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Total", blueprints.length],
          ["Ready", readyCount],
          ["Published", publishedCount],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="admin-kicker text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {blueprints.slice(0, 4).map((blueprint) => (
          <Link
            key={blueprint.id}
            to={ADMIN_ROUTES.questionBlueprints}
            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{blueprint.title}</p>
              <p className="truncate text-xs text-slate-500">
                {blueprint.grade.name} • {blueprint.subject.name} • {blueprint.mode}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={blueprintStatusClassName(blueprint.status)}>
                {blueprint.status}
              </Badge>
              {blueprint.templateConfig.isPublished ? (
                <Badge className="border-cyan-200 bg-cyan-50 text-cyan-700">template</Badge>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </PagePanel>
  );
}
