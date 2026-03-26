import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpenCheck,
  FileOutput,
  FileText,
  History,
  ImagePlus,
  Layers3,
  Loader2,
  Rocket,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { PageHeader, SectionCard, StatGrid } from "@/components/ui/page-shell";
import { useSubscriptionPageData } from "../hooks/use-subscription-page-data";
import { getPlanCatalogItem, PLAN_CATALOG } from "../subscription-catalog";
import {
  InfoRow,
  PlanCatalogCard,
  RequestHistoryCard,
  RequestStatusPill,
  UsageCard,
  UsagePill,
} from "./subscription-shared";

const PAYMENT_INSTRUCTIONS = {
  heading: "Manual payment",
  provider: "KBZPay / Wave / Bank transfer",
  accountName: "MM Exam Studio",
  accountRef: "Use your registered email as the transfer note when possible.",
  note:
    "After payment, paste the transaction ID and upload a clear screenshot so admin can approve your plan faster.",
} as const;

const formatLimitValue = (value: number | null | undefined, suffix: string) =>
  value == null ? "Plan-specific cap" : `${value} ${suffix}`;

export function SubscriptionPage() {
  const {
    fileInputRef,
    requestNote,
    setRequestNote,
    transactionId,
    setTransactionId,
    selectedProofName,
    paymentProofImageDataUrl,
    selectedPlanCode,
    setSelectedPlanCode,
    summaryQuery,
    summary,
    plan,
    requests,
    latestRequest,
    pendingCount,
    isPending,
    requestMutation,
    cancelMutation,
    onPaymentProofFileChange,
  } = useSubscriptionPageData();
  const selectedPlan = getPlanCatalogItem(selectedPlanCode);
  const isHighestPlan = plan?.code === "premium";
  const canRequestSelectedPlan = !isHighestPlan && plan?.code !== selectedPlanCode;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Subscription"
        title={plan ? `${plan.name} plan` : "Usage overview"}
        description="Limits, requests, and history in one page."
        chips={
          <>
            <span className="app-chip">Cycle {plan?.billingCycle ?? "monthly"}</span>
            <span className="app-chip">{pendingCount} pending</span>
            <span className="app-chip">{plan?.status ?? "active"}</span>
          </>
        }
        actions={
          <Button asChild>
            <Link to="/question-papers">
              Open papers
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      {latestRequest ? (
        <Notice>
          Latest request:{" "}
          {latestRequest.requestedPlanCode === "premium"
            ? "Premium"
            : latestRequest.requestedPlanCode === "pro"
              ? "Pro"
              : "Free"}{" "}
          • {latestRequest.status.replace("_", " ")}
        </Notice>
      ) : null}

      <StatGrid>
        <UsageCard
          icon={BookOpenCheck}
          label="Practice sessions"
          value={summary?.practiceSessionsCount ?? 0}
          note={`${summary?.completedPracticeCount ?? 0} completed`}
          tone="emerald"
        />
        <UsageCard
          icon={FileText}
          label="Saved papers"
          value={summary?.papersCount ?? 0}
          note="Drafts and ready-to-print papers"
          tone="sky"
        />
        <UsageCard
          icon={FileOutput}
          label="PDF exports"
          value={summary?.exportedPapersCount ?? 0}
          note={
            plan?.remaining.pdfExports === null || plan?.remaining.pdfExports === undefined
              ? "No monthly cap"
              : `${plan.remaining.pdfExports} left this period`
          }
          tone="amber"
        />
        <UsageCard
          icon={ShieldCheck}
          label="Devices"
          value={plan?.limits.deviceLimit ?? 0}
          note="Allowed devices for this account"
          tone="slate"
        />
      </StatGrid>

      <SectionCard
        title="Choose the workflow that fits your teaching load."
        description="We keep the request flow manual, but the plan comparison below now matches the current app limits."
        actions={<UsagePill label="Current plan" value={plan?.name ?? "Free"} />}
        className="rounded-2xl sm:p-5"
      >
        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          {PLAN_CATALOG.map((item) => (
            <PlanCatalogCard
              key={item.code}
              item={item}
              isCurrent={plan?.code === item.code}
              isSelected={selectedPlanCode === item.code}
              isSelectable={item.code !== "free" && plan?.code !== item.code}
              onSelect={() => {
                if (item.code !== "free") {
                  setSelectedPlanCode(item.code);
                }
              }}
            />
          ))}
        </div>
      </SectionCard>

      <section className="stagger-children grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <SectionCard
          title="Current state"
          actions={
            <UsagePill
              label="Source"
              value={summaryQuery.isLoading ? "Loading" : summary ? "Live data" : "Awaiting"}
            />
          }
        >
          <div className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <InfoRow label="Plan code" value={plan?.code ?? "free"} />
            <InfoRow label="Billing cycle" value={plan?.billingCycle ?? "monthly"} />
            <InfoRow label="Plan status" value={plan?.status ?? "active"} />
          </div>
        </SectionCard>

        <SectionCard
          title={PAYMENT_INSTRUCTIONS.heading}
          actions={<UsagePill label="Review flow" value="Manual approval" />}
        >
          <div className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <InfoRow label="Accepted method" value={PAYMENT_INSTRUCTIONS.provider} />
            <InfoRow label="Pay to" value={PAYMENT_INSTRUCTIONS.accountName} />
            <InfoRow label="Reference" value={PAYMENT_INSTRUCTIONS.accountRef} />
            <p className="text-sm text-slate-600">{PAYMENT_INSTRUCTIONS.note}</p>
          </div>
        </SectionCard>

        <SectionCard title="Limits" className="xl:col-span-2">
          <div className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <InfoRow
              label="Questions per practice"
              value={
                formatLimitValue(plan?.limits.maxQuestionsPerPractice, "max each session")
              }
            />
            <InfoRow
              label="Questions per paper"
              value={
                formatLimitValue(plan?.limits.maxQuestionsPerPaper, "max each paper")
              }
            />
            <InfoRow
              label="Paper generation"
              value={
                plan?.limits.monthlyPaperGenerationLimit == null
                  ? "Plan-specific cap"
                  : `${plan.usage.paperGenerationsUsed}/${plan.limits.monthlyPaperGenerationLimit}`
              }
            />
            <InfoRow
              label="PDF exports"
              value={
                plan?.limits.monthlyPdfExportLimit == null
                  ? "Plan-specific cap"
                  : `${plan.usage.pdfExportsUsed}/${plan.limits.monthlyPdfExportLimit}`
              }
            />
            <InfoRow
              label="Smart swaps"
              value={
                plan?.limits.monthlyPaperSwapLimit == null
                  ? "Plan-specific cap"
                  : `${plan.usage.paperSwapsUsed}/${plan.limits.monthlyPaperSwapLimit}`
              }
            />
          </div>
        </SectionCard>
      </section>

      <section className="stagger-children grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="app-icon-chip">
                  <Rocket className="h-4 w-4 text-slate-700" />
                </span>
                <h3 className="text-base font-semibold text-slate-900">Upgrade request</h3>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {isHighestPlan
                  ? "This account already uses the highest plan."
                  : `Selected target: ${selectedPlan.name}. Submit payment proof, then send one request for admin approval.`}
              </p>
            </div>
            {latestRequest ? (
              <UsagePill
                label="Latest"
                value={latestRequest.status.replace("_", " ")}
              />
            ) : null}
          </div>

          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Selected plan
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{selectedPlan.name}</p>
                  <p className="mt-1 text-sm text-slate-600">{selectedPlan.tagline}</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <UsagePill label="Paper export" value={selectedPlan.limitSummary.exports} />
                  <UsagePill label="Paper generation" value={selectedPlan.limitSummary.generations} />
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Transaction ID
                </span>
                <input
                  value={transactionId}
                  onChange={(event) => setTransactionId(event.target.value)}
                  placeholder="KBZ-123456, Wave-ABC123, Receipt number"
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none ring-0 transition focus:border-slate-900"
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Payment proof
                </span>
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={onPaymentProofFileChange}
                    className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                  />
                </div>
              </label>
            </div>
            {selectedProofName ? (
              <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                <ImagePlus className="h-4 w-4 text-slate-500" />
                <p className="text-sm text-slate-700">{selectedProofName}</p>
              </div>
            ) : null}
            {paymentProofImageDataUrl ? (
              <div className="mt-3 flex h-40 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                <img
                  src={paymentProofImageDataUrl}
                  alt="Payment proof preview"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : null}
            <label className="mt-4 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Request note
            </label>
            <textarea
              value={requestNote}
              onChange={(event) => setRequestNote(event.target.value)}
              placeholder="Optional note for admin, for example why you need Pro or Premium."
              className="mt-2 min-h-24 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-slate-900"
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                className="w-full sm:w-auto"
                onClick={() => requestMutation.mutate(selectedPlanCode)}
                disabled={
                  requestMutation.isPending ||
                  isPending ||
                  !transactionId.trim() ||
                  !canRequestSelectedPlan
                }
              >
                {requestMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {`Request ${selectedPlan.name}`}
              </Button>
              {!isHighestPlan ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-white sm:w-auto"
                  onClick={() =>
                    setSelectedPlanCode(selectedPlanCode === "pro" ? "premium" : "pro")
                  }
                >
                  <Layers3 className="h-4 w-4" />
                  {selectedPlanCode === "pro" ? "Switch to Premium" : "Switch to Pro"}
                </Button>
              ) : null}
              {latestRequest?.status === "pending" ? (
                <Button
                  variant="ghost"
                  onClick={() => cancelMutation.mutate(latestRequest.id)}
                  disabled={cancelMutation.isPending}
                >
                  {cancelMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Cancel request
                </Button>
              ) : null}
            </div>
            {!canRequestSelectedPlan && !isHighestPlan ? (
              <Notice className="mt-3">
                This account already uses {selectedPlan.name}. Choose the other upgrade tier if you
                want to submit a new request.
              </Notice>
            ) : null}
            {isHighestPlan ? (
              <Notice className="mt-3">
                Premium is already active on this account, so no higher request tier is available.
              </Notice>
            ) : null}
            <p className="mt-3 text-xs text-slate-500">Use a clear screenshot for faster review.</p>
            {requestMutation.error instanceof Error ? (
              <Notice tone="error" className="mt-3">
                {requestMutation.error.message}
              </Notice>
            ) : null}
            {cancelMutation.error instanceof Error ? (
              <Notice tone="error" className="mt-3">
                {cancelMutation.error.message}
              </Notice>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-slate-900">Latest request</h3>
            {latestRequest ? (
              <RequestStatusPill status={latestRequest.status} />
            ) : null}
          </div>
          <div className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <InfoRow
              label="Requested plan"
              value={latestRequest?.requestedPlanCode ?? "No request yet"}
            />
            <InfoRow
              label="Transaction ID"
              value={latestRequest?.transactionId ?? "No request yet"}
            />
            <InfoRow
              label="Request status"
              value={latestRequest ? latestRequest.status.replace("_", " ") : "Awaiting"}
            />
            <InfoRow
              label="Submitted"
              value={
                latestRequest?.createdAt
                  ? new Date(latestRequest.createdAt).toLocaleString()
                  : "No request yet"
              }
            />
            <InfoRow
              label="Admin note"
              value={latestRequest?.adminNote ?? latestRequest?.note ?? "No note yet"}
            />
            {latestRequest?.paymentProofImageDataUrl ? (
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <img
                  src={latestRequest.paymentProofImageDataUrl}
                  alt="Latest payment proof"
                  className="h-48 w-full object-contain"
                />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Request history</h3>
            <p className="mt-1 text-sm text-slate-500">
              Track approvals, review notes, and payment proof records in one place.
            </p>
          </div>
          <UsagePill label="Total requests" value={String(requests.length)} />
        </div>
        <div className="mt-4 space-y-3">
          {requests.length > 0 ? (
            requests.map((request) => <RequestHistoryCard key={request.id} request={request} />)
          ) : (
            <EmptyState
              title="No subscription requests yet"
              description="Submit a request above to start plan approval."
              icon={History}
              className="border-slate-200 bg-slate-50 py-6"
            />
          )}
        </div>
      </section>
    </div>
  );
}
