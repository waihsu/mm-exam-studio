import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpenCheck,
  FileOutput,
  FileText,
  History,
  ImagePlus,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { useSubscriptionPageData } from "../hooks/use-subscription-page-data";
import { InfoRow, RequestStatusPill, UsageCard, UsagePill } from "./subscription-shared";

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

  return (
    <div className="space-y-4">
      <section className="app-hero">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Subscription
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              {plan ? `${plan.name} plan` : "Usage overview"}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Limits, requests, and history in one page.
            </p>
            {latestRequest ? (
              <p className="mt-3 text-sm text-slate-600">
                Latest request: {latestRequest.requestedPlanCode === "premium" ? "Premium" : latestRequest.requestedPlanCode === "pro" ? "Pro" : "Free"} •{" "}
                {latestRequest.status.replace("_", " ")}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="app-chip">
                Cycle {plan?.billingCycle ?? "monthly"}
              </span>
              <span className="app-chip">
                {pendingCount} pending
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/question-papers">
                Open papers
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="stagger-children grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
      </div>

      <section className="stagger-children grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-base font-semibold text-slate-900">{PAYMENT_INSTRUCTIONS.heading}</h3>
          <div className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <InfoRow label="Accepted method" value={PAYMENT_INSTRUCTIONS.provider} />
            <InfoRow label="Pay to" value={PAYMENT_INSTRUCTIONS.accountName} />
            <InfoRow label="Reference" value={PAYMENT_INSTRUCTIONS.accountRef} />
            <p className="text-sm text-slate-600">{PAYMENT_INSTRUCTIONS.note}</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-slate-900">Current state</h3>
            <UsagePill
              label="Source"
              value={summaryQuery.isLoading ? "Loading" : summary ? "Live data" : "Awaiting"}
            />
          </div>
          <div className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <InfoRow label="Plan code" value={plan?.code ?? "free"} />
            <InfoRow label="Billing cycle" value={plan?.billingCycle ?? "monthly"} />
            <InfoRow label="Plan status" value={plan?.status ?? "active"} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-base font-semibold text-slate-900">Limits</h3>
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
        </div>
      </section>

      <section className="stagger-children grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Upgrade request</h3>
              <p className="mt-1 text-sm text-slate-500">Submit a request for admin approval.</p>
            </div>
            {latestRequest ? (
              <UsagePill
                label="Latest"
                value={latestRequest.status.replace("_", " ")}
              />
            ) : null}
          </div>

          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
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
                onClick={() => requestMutation.mutate("pro")}
                disabled={requestMutation.isPending || isPending || !transactionId.trim()}
              >
                {requestMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Request Pro
              </Button>
              <Button
                variant="outline"
                className="w-full bg-white sm:w-auto"
                onClick={() => requestMutation.mutate("premium")}
                disabled={requestMutation.isPending || isPending || !transactionId.trim()}
              >
                {requestMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Request Premium
              </Button>
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

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-base font-semibold text-slate-900">Request history</h3>
        <div className="mt-4 space-y-3">
          {requests.length > 0 ? (
            requests.map((request) => (
              <div
                key={request.id}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">
                    {request.requestedPlanCode} plan
                  </p>
                  <RequestStatusPill status={request.status} />
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  Submitted {new Date(request.createdAt).toLocaleString()}
                </p>
                {request.transactionId ? (
                  <p className="mt-2 text-sm text-slate-700">
                    Transaction ID: {request.transactionId}
                  </p>
                ) : null}
                {request.note ? (
                  <p className="mt-2 text-sm text-slate-700">Your note: {request.note}</p>
                ) : null}
                {request.adminNote ? (
                  <p className="mt-1 text-sm text-slate-700">Admin note: {request.adminNote}</p>
                ) : null}
                {request.paymentProofImageDataUrl ? (
                  <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <img
                      src={request.paymentProofImageDataUrl}
                      alt="Payment proof"
                      className="h-40 w-full object-contain"
                    />
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            <EmptyState
              title="No subscription requests yet"
              description="Submit a request above to start plan approval."
              icon={History}
              className="border-slate-200 bg-slate-50 py-6"
            />
          )}
        </div>
      </div>
    </div>
  );
}
