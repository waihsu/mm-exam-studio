import { BookOpenCheck, CheckCircle2, LockKeyhole, Sparkles } from "lucide-react";
import type { SubscriptionRequestRecord } from "@/features/workspace/types";
import type { PlanCatalogItem } from "../subscription-catalog";
import { Button } from "@/components/ui/button";

export function UsageCard({
  icon: Icon,
  label,
  value,
  note,
  tone,
}: {
  icon: typeof BookOpenCheck;
  label: string;
  value: number;
  note: string;
  tone: "emerald" | "sky" | "amber" | "slate";
}) {
  const toneClass = {
    emerald: "border-emerald-100 bg-emerald-50/50",
    sky: "border-sky-100 bg-sky-50/50",
    amber: "border-amber-100 bg-amber-50/60",
    slate: "border-slate-200 bg-white",
  }[tone];

  return (
    <div className={`rounded-xl border p-4 shadow-[0_14px_30px_-28px_rgba(15,23,42,0.3)] ${toneClass}`}>
      <div className="flex items-center gap-2">
        <span className="app-icon-chip">
          <Icon className="h-4 w-4 text-slate-700" />
        </span>
        <h3 className="font-semibold text-slate-900">{label}</h3>
      </div>
      <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{note}</p>
    </div>
  );
}

export function RequestStatusPill({ status }: { status: SubscriptionRequestRecord["status"] }) {
  const toneClass =
    status === "approved"
      ? "bg-emerald-100 text-emerald-800"
      : status === "pending"
        ? "bg-amber-100 text-amber-800"
        : status === "rejected"
          ? "bg-rose-100 text-rose-800"
          : "bg-slate-200 text-slate-700";

  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${toneClass}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export function RequestHistoryCard({
  request,
}: {
  request: SubscriptionRequestRecord;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            {formatPlanLabel(request.requestedPlanCode)}
          </p>
          <h4 className="mt-1 text-base font-semibold text-slate-900">
            {request.status === "approved"
              ? "Approved upgrade"
              : request.status === "rejected"
                ? "Review completed"
                : request.status === "canceled"
                  ? "Request canceled"
                  : "Awaiting admin review"}
          </h4>
          <p className="mt-1 text-sm text-slate-500">
            Submitted {new Date(request.createdAt).toLocaleString()}
          </p>
        </div>
        <RequestStatusPill status={request.status} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <HistoryMeta label="Requested plan" value={formatPlanLabel(request.requestedPlanCode)} />
        <HistoryMeta label="Transaction ID" value={request.transactionId ?? "Not provided"} />
        <HistoryMeta
          label="Reviewed"
          value={request.reviewedAt ? new Date(request.reviewedAt).toLocaleString() : "Pending"}
        />
        <HistoryMeta
          label="Reviewer"
          value={request.reviewer?.name ?? request.reviewer?.email ?? "Not assigned"}
        />
      </div>

      {request.note || request.adminNote ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <HistoryNote
            label="Your note"
            value={request.note ?? "No note added"}
          />
          <HistoryNote
            label="Admin note"
            value={request.adminNote ?? "No review note yet"}
          />
        </div>
      ) : null}

      {request.paymentProofImageDataUrl ? (
        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          <img
            src={request.paymentProofImageDataUrl}
            alt="Payment proof"
            className="h-44 w-full object-contain"
          />
        </div>
      ) : null}
    </article>
  );
}

export function UsagePill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm leading-6 text-slate-900">{value}</p>
    </div>
  );
}

export function PlanCatalogCard({
  item,
  isCurrent,
  isSelected,
  isSelectable,
  onSelect,
}: {
  item: PlanCatalogItem;
  isCurrent: boolean;
  isSelected: boolean;
  isSelectable: boolean;
  onSelect: () => void;
}) {
  const toneClass =
    item.code === "premium"
      ? "border-indigo-300 bg-[linear-gradient(145deg,#eff1ff_0%,#f8f8ff_56%,#eef7ff_100%)]"
      : item.code === "pro"
        ? "border-sky-200 bg-[linear-gradient(145deg,#effaff_0%,#ffffff_70%)]"
        : "border-slate-200 bg-white";

  const icon =
    item.code === "premium"
      ? Sparkles
      : item.code === "pro"
        ? CheckCircle2
        : LockKeyhole;
  const Icon = icon;

  return (
    <article
      className={[
        "rounded-2xl border p-5 transition",
        toneClass,
        isCurrent ? "border-slate-900 ring-1 ring-slate-900/10" : "",
        isSelected ? "border-indigo-500 shadow-[0_22px_46px_-32px_rgba(15,23,42,0.44)]" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="app-icon-chip">
              <Icon className="h-4 w-4 text-slate-700" />
            </span>
            <h3 className="text-xl font-bold tracking-tight text-slate-950">{item.name}</h3>
          </div>
          <p className="mt-2 text-sm font-medium text-slate-700">{item.tagline}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {isCurrent ? (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">
              Current
            </span>
          ) : null}
          {isSelected && !isCurrent ? (
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700">
              Selected
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <PlanMetric label="Practice" value={item.limitSummary.practice} />
        <PlanMetric label="Paper" value={item.limitSummary.paper} />
        <PlanMetric label="Exports" value={item.limitSummary.exports} />
        <PlanMetric label="Generations" value={item.limitSummary.generations} />
        <PlanMetric label="Swaps" value={item.limitSummary.swaps} />
        <PlanMetric label="Devices" value={item.limitSummary.devices} />
      </div>

      <div className="mt-4 rounded-xl border border-white/90 bg-white/75 p-3 backdrop-blur-sm">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Included</p>
        <ul className="mt-2 space-y-2 text-sm text-slate-700">
          {item.highlights.map((highlight) => (
            <li key={highlight} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
              <span>{highlight}</span>
            </li>
          ))}
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            <span>{item.limitSummary.branding}</span>
          </li>
        </ul>
      </div>

      <div className="mt-4">
        <Button
          type="button"
          variant={isCurrent ? "outline" : "default"}
          className={isCurrent ? "w-full rounded-xl bg-white" : "w-full rounded-xl"}
          disabled={!isSelectable}
          onClick={onSelect}
        >
          {isCurrent ? "Current plan" : item.ctaLabel}
        </Button>
      </div>
    </article>
  );
}

function PlanMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function HistoryMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function HistoryNote({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function formatPlanLabel(planCode: SubscriptionRequestRecord["requestedPlanCode"]) {
  return planCode === "premium" ? "Premium plan" : planCode === "pro" ? "Pro plan" : "Free plan";
}
