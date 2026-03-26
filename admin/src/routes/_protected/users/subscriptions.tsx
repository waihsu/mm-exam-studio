import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Gauge,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";
import { PaginationControls } from "@/components/data-table/pagination-controls";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PagePanel } from "@/components/page-container";
import { AdminPageHeader, AdminStatPill } from "@/components/page-shell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { subscriptionApi } from "@/features/subscriptions/api/subscription.api";
import type {
  AdminSubscriptionRequest,
  AdminSubscriptionRow,
  BillingCycle,
  PlanCode,
  SubscriptionStatus,
  UpdateAdminSubscriptionInput,
} from "@/features/subscriptions/types";

type SubscriptionSearch = {
  page?: number;
  pageSize?: number;
  search?: string;
  planCode?: PlanCode;
  status?: SubscriptionStatus;
};

type SubscriptionDraft = {
  planCode: PlanCode;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  endsAt: string;
  deviceLimitOverride: string;
  maxQuestionsPerPracticeOverride: string;
  maxQuestionsPerPaperOverride: string;
  monthlyPdfExportLimitOverride: string;
  monthlyPaperGenerationLimitOverride: string;
  monthlyPaperSwapLimitOverride: string;
};

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 12;
const PAGE_SIZE_OPTIONS = [12, 24, 48];
const REQUEST_PAGE_SIZE_OPTIONS = [8, 16, 24];
const MANUAL_PAYMENT_REVIEW_NOTE =
  "Manual approval flow: compare transaction ID, screenshot proof, and requested plan before approving.";

const toDateInputValue = (value: string | null) =>
  value ? new Date(value).toISOString().slice(0, 10) : "";

const toNumberOrNull = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
};

const toDraft = (row: AdminSubscriptionRow): SubscriptionDraft => ({
  planCode: row.subscription.plan.code,
  status: row.subscription.status,
  billingCycle: row.subscription.billingCycle,
  endsAt: toDateInputValue(row.subscription.endsAt),
  deviceLimitOverride:
    row.subscription.overrides.deviceLimitOverride?.toString() ?? "",
  maxQuestionsPerPracticeOverride:
    row.subscription.overrides.maxQuestionsPerPracticeOverride?.toString() ?? "",
  maxQuestionsPerPaperOverride:
    row.subscription.overrides.maxQuestionsPerPaperOverride?.toString() ?? "",
  monthlyPdfExportLimitOverride:
    row.subscription.overrides.monthlyPdfExportLimitOverride?.toString() ?? "",
  monthlyPaperGenerationLimitOverride:
    row.subscription.overrides.monthlyPaperGenerationLimitOverride?.toString() ?? "",
  monthlyPaperSwapLimitOverride:
    row.subscription.overrides.monthlyPaperSwapLimitOverride?.toString() ?? "",
});

const toSubmitInput = (draft: SubscriptionDraft): UpdateAdminSubscriptionInput => ({
  planCode: draft.planCode,
  status: draft.status,
  billingCycle: draft.billingCycle,
  endsAt: draft.endsAt ? new Date(`${draft.endsAt}T00:00:00.000Z`).toISOString() : null,
  deviceLimitOverride: toNumberOrNull(draft.deviceLimitOverride),
  maxQuestionsPerPracticeOverride: toNumberOrNull(draft.maxQuestionsPerPracticeOverride),
  maxQuestionsPerPaperOverride: toNumberOrNull(draft.maxQuestionsPerPaperOverride),
  monthlyPdfExportLimitOverride: toNumberOrNull(draft.monthlyPdfExportLimitOverride),
  monthlyPaperGenerationLimitOverride: toNumberOrNull(
    draft.monthlyPaperGenerationLimitOverride,
  ),
  monthlyPaperSwapLimitOverride: toNumberOrNull(draft.monthlyPaperSwapLimitOverride),
});

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString() : "No end date";

const statusTone = (status: SubscriptionStatus) => {
  if (status === "active") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "past_due") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
};

const requestStatusTone = (
  status: AdminSubscriptionRequest["status"],
) => {
  if (status === "approved") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "rejected") return "border-rose-200 bg-rose-50 text-rose-700";
  if (status === "pending") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-100 text-slate-700";
};

export const Route = createFileRoute("/_protected/users/subscriptions")({
  validateSearch: (search): SubscriptionSearch => ({
    page:
      typeof search.page === "number"
        ? search.page
        : typeof search.page === "string"
          ? Number(search.page) || DEFAULT_PAGE
          : undefined,
    pageSize:
      typeof search.pageSize === "number"
        ? search.pageSize
        : typeof search.pageSize === "string"
          ? Number(search.pageSize) || DEFAULT_PAGE_SIZE
          : undefined,
    search: typeof search.search === "string" ? search.search : undefined,
    planCode:
      search.planCode === "free" || search.planCode === "pro" || search.planCode === "premium"
        ? search.planCode
        : undefined,
    status:
      search.status === "active" ||
      search.status === "canceled" ||
      search.status === "past_due" ||
      search.status === "expired"
        ? search.status
        : undefined,
  }),
  component: UserSubscriptionsPage,
});

function UserSubscriptionsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const search = Route.useSearch();
  const page = search.page ?? DEFAULT_PAGE;
  const pageSize = search.pageSize ?? DEFAULT_PAGE_SIZE;
  const [searchInput, setSearchInput] = useState(search.search ?? "");
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, SubscriptionDraft>>({});
  const [requestNotes, setRequestNotes] = useState<Record<string, string>>({});
  const [requestSearchInput, setRequestSearchInput] = useState("");
  const [requestSearch, setRequestSearch] = useState("");
  const [requestStatus, setRequestStatus] = useState<
    "pending" | "approved" | "rejected" | "canceled" | "all"
  >("pending");
  const [requestPlanCode, setRequestPlanCode] = useState<PlanCode | "all">("all");
  const [requestPage, setRequestPage] = useState(1);
  const [requestPageSize, setRequestPageSize] = useState(8);

  const plansQuery = useQuery({
    queryKey: ["admin-subscription-plans"],
    queryFn: async () => {
      const response = await subscriptionApi.getPlans();
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
  });

  const subscriptionsQuery = useQuery({
    queryKey: [
      "admin-subscriptions",
      page,
      pageSize,
      search.search ?? "",
      search.planCode ?? "",
      search.status ?? "",
    ],
    queryFn: async () => {
      const response = await subscriptionApi.getAdminUsers({
        page,
        pageSize,
        search: search.search,
        planCode: search.planCode,
        status: search.status,
      });
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
    placeholderData: (previousData) => previousData,
  });

  const requestsQuery = useQuery({
    queryKey: [
      "admin-subscription-requests",
      requestPage,
      requestPageSize,
      requestSearch,
      requestStatus,
      requestPlanCode,
    ],
    queryFn: async () => {
      const response = await subscriptionApi.getRequests({
        page: requestPage,
        pageSize: requestPageSize,
        search: requestSearch || undefined,
        status: requestStatus === "all" ? undefined : requestStatus,
        planCode: requestPlanCode === "all" ? undefined : requestPlanCode,
      });
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (params: { userId: string; input: UpdateAdminSubscriptionInput }) => {
      const response = await subscriptionApi.updateUserSubscription(
        params.userId,
        params.input,
      );
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onSuccess: async (row) => {
      toast.success(`Subscription updated for ${row.user.name}`);
      setDrafts((current) => ({
        ...current,
        [row.user.id]: toDraft(row),
      }));
      await queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
      await queryClient.invalidateQueries({ queryKey: ["workspace-summary"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update subscription",
      );
    },
  });

  const reviewRequestMutation = useMutation({
    mutationFn: async (params: {
      requestId: string;
      decision: "approved" | "rejected";
      adminNote?: string;
    }) => {
      const response = await subscriptionApi.reviewRequest(params.requestId, {
        decision: params.decision,
        adminNote: params.adminNote,
      });
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onSuccess: async (data) => {
      toast.success(
        data.request.status === "approved"
          ? "Request approved and subscription updated"
          : "Request rejected",
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-subscription-requests"] }),
      ]);
      setRequestNotes((current) => ({
        ...current,
        [data.request.id]: "",
      }));
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to review request",
      );
    },
  });

  const applySearch = async () => {
    await navigate({
      to: Route.to,
      search: {
        page: DEFAULT_PAGE,
        pageSize,
        search: searchInput.trim() || undefined,
        planCode: search.planCode,
        status: search.status,
      },
    });
  };

  const setDraftField = <K extends keyof SubscriptionDraft>(
    userId: string,
    row: AdminSubscriptionRow,
    field: K,
    value: SubscriptionDraft[K],
  ) => {
    setDrafts((current) => ({
      ...current,
      [userId]: {
        ...(current[userId] ?? toDraft(row)),
        [field]: value,
      },
    }));
  };

  const getDraft = (row: AdminSubscriptionRow) => drafts[row.user.id] ?? toDraft(row);

  const applyQuickApproval = (row: AdminSubscriptionRow, planCode: PlanCode) => {
    const nextDraft: SubscriptionDraft = {
      ...toDraft(row),
      planCode,
      status: "active",
      billingCycle: "monthly",
      endsAt: "",
      deviceLimitOverride: "",
      maxQuestionsPerPracticeOverride: "",
      maxQuestionsPerPaperOverride: "",
      monthlyPdfExportLimitOverride: "",
      monthlyPaperGenerationLimitOverride: "",
      monthlyPaperSwapLimitOverride: "",
    };

    setDrafts((current) => ({
      ...current,
      [row.user.id]: nextDraft,
    }));

    void saveMutation.mutateAsync({
      userId: row.user.id,
      input: toSubmitInput(nextDraft),
    });
  };

  if ((plansQuery.isLoading && !plansQuery.data) || (subscriptionsQuery.isLoading && !subscriptionsQuery.data)) {
    return <PagePanel className="bg-white/88">Loading subscription controls...</PagePanel>;
  }

  if (plansQuery.error instanceof Error || subscriptionsQuery.error instanceof Error || !plansQuery.data || !subscriptionsQuery.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Could not load subscription controls</AlertTitle>
        <AlertDescription>
          {plansQuery.error instanceof Error
            ? plansQuery.error.message
            : subscriptionsQuery.error instanceof Error
              ? subscriptionsQuery.error.message
              : "Missing subscription data."}
        </AlertDescription>
      </Alert>
    );
  }

  const subscriptionPage = subscriptionsQuery.data;
  const from =
    subscriptionPage.total === 0
      ? 0
      : (subscriptionPage.page - 1) * subscriptionPage.pageSize + 1;
  const to =
    subscriptionPage.total === 0
      ? 0
      : Math.min(
          (subscriptionPage.page - 1) * subscriptionPage.pageSize +
            subscriptionPage.rows.length,
          subscriptionPage.total,
        );
  const activeSubscriptions = subscriptionPage.rows.filter(
    (row) => row.subscription.status === "active",
  ).length;
  const pendingRequests =
    requestsQuery.data?.rows.filter((request) => request.status === "pending").length ?? 0;

  return (
    <div className="space-y-4">
      <AdminPageHeader
        eyebrow="Subscription Approval"
        title="Approve plans and tune usage limits"
        description="Assign Free, Pro, or Premium, review payment requests, and apply account-level overrides without leaving the approval workspace."
        actions={
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <AdminStatPill label="Visible users" value={`${subscriptionPage.total}`} />
            <AdminStatPill label="Active now" value={`${activeSubscriptions}`} tone="emerald" />
            <AdminStatPill
              label="Pending requests"
              value={`${pendingRequests}`}
              tone="amber"
            />
            <AdminStatPill label="Showing rows" value={`${from}-${to}`} tone="cyan" />
          </div>
        }
      />

      <PagePanel className="space-y-4 bg-gradient-to-br from-white/95 via-slate-50/80 to-slate-100/70">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_170px_170px_auto]">
          <div className="space-y-2">
            <Label htmlFor="subscription-search">Search user</Label>
            <Input
              id="subscription-search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by name or email"
            />
          </div>

          <div className="space-y-2">
            <Label>Plan</Label>
            <Select
              value={search.planCode ?? "all"}
              onValueChange={(value) => {
                void navigate({
                  to: Route.to,
                  search: {
                    page: DEFAULT_PAGE,
                    pageSize,
                    search: search.search,
                    planCode:
                      value === "free" || value === "pro" || value === "premium"
                        ? value
                        : undefined,
                    status: search.status,
                  },
                });
              }}
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="All plans" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All plans</SelectItem>
                {plansQuery.data.map((plan) => (
                  <SelectItem key={plan.code} value={plan.code}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={search.status ?? "all"}
              onValueChange={(value) => {
                void navigate({
                  to: Route.to,
                  search: (current) => ({
                    ...current,
                    page: DEFAULT_PAGE,
                    status:
                      value === "active" ||
                      value === "canceled" ||
                      value === "past_due" ||
                      value === "expired"
                        ? value
                        : undefined,
                  }),
                });
              }}
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="past_due">Past due</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-end">
            <Button onClick={() => void applySearch()} className="sm:w-auto">
              Apply
            </Button>
            <Button
              variant="outline"
              className="sm:w-auto"
              onClick={() => {
                setSearchInput("");
                void navigate({
                  to: Route.to,
                  search: () => ({
                    page: DEFAULT_PAGE,
                    pageSize,
                  }),
                });
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      </PagePanel>

      <PagePanel className="space-y-4 bg-white/92">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-black text-slate-900">Upgrade request queue</h3>
            <p className="mt-1 text-sm text-slate-600">
              Review new requests, search transaction IDs, and reopen recent decisions quickly.
            </p>
            <p className="mt-2 text-xs font-medium text-slate-500">
              {MANUAL_PAYMENT_REVIEW_NOTE}
            </p>
          </div>
          <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
            {requestsQuery.data?.total ?? 0} results
          </Badge>
        </div>

        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_170px_170px_140px_auto]">
          <div className="space-y-2">
            <Label htmlFor="request-search">Search request</Label>
            <Input
              id="request-search"
              value={requestSearchInput}
              onChange={(event) => setRequestSearchInput(event.target.value)}
              placeholder="Search name, email, or transaction ID"
            />
          </div>
          <div className="space-y-2">
            <Label>Plan</Label>
            <Select
              value={requestPlanCode}
              onValueChange={(value) => {
                setRequestPlanCode(value as PlanCode | "all");
                setRequestPage(1);
              }}
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="All plans" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All plans</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Request status</Label>
            <Select
              value={requestStatus}
              onValueChange={(value) => {
                setRequestStatus(value as typeof requestStatus);
                setRequestPage(1);
              }}
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Per page</Label>
            <Select
              value={String(requestPageSize)}
              onValueChange={(value) => {
                setRequestPageSize(Number(value));
                setRequestPage(1);
              }}
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REQUEST_PAGE_SIZE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-end">
            <Button
              onClick={() => {
                setRequestSearch(requestSearchInput.trim());
                setRequestPage(1);
              }}
            >
              Apply
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setRequestSearchInput("");
                setRequestSearch("");
                setRequestStatus("pending");
                setRequestPlanCode("all");
                setRequestPage(1);
                setRequestPageSize(8);
              }}
            >
              Clear
            </Button>
          </div>
        </div>

        {requestsQuery.isLoading && !requestsQuery.data ? (
          <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
            Loading request queue...
          </div>
        ) : requestsQuery.error instanceof Error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
            {requestsQuery.error.message}
          </div>
        ) : requestsQuery.data && requestsQuery.data.rows.length > 0 ? (
          <div className="space-y-3">
            {requestsQuery.data.rows.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                note={requestNotes[request.id] ?? ""}
                onNoteChange={(value) =>
                  setRequestNotes((current) => ({
                    ...current,
                    [request.id]: value,
                  }))
                }
                onApprove={() =>
                  reviewRequestMutation.mutate({
                    requestId: request.id,
                    decision: "approved",
                    adminNote: requestNotes[request.id]?.trim() || undefined,
                  })
                }
                onReject={() =>
                  reviewRequestMutation.mutate({
                    requestId: request.id,
                    decision: "rejected",
                    adminNote: requestNotes[request.id]?.trim() || undefined,
                  })
                }
                disabled={reviewRequestMutation.isPending}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
            No subscription requests match these filters.
          </div>
        )}

        {requestsQuery.data ? (
          <PaginationControls
            page={requestsQuery.data.page}
            totalPages={Math.max(
              1,
              Math.ceil(requestsQuery.data.total / requestsQuery.data.pageSize),
            )}
            totalRows={requestsQuery.data.total}
            from={
              requestsQuery.data.total === 0
                ? 0
                : (requestsQuery.data.page - 1) * requestsQuery.data.pageSize + 1
            }
            to={
              requestsQuery.data.total === 0
                ? 0
                : Math.min(
                    (requestsQuery.data.page - 1) * requestsQuery.data.pageSize +
                      requestsQuery.data.rows.length,
                    requestsQuery.data.total,
                  )
            }
            pageSize={requestsQuery.data.pageSize}
            pageSizeOptions={REQUEST_PAGE_SIZE_OPTIONS}
            onPageSizeChange={(nextSize) => {
              setRequestPageSize(nextSize);
              setRequestPage(1);
            }}
            onPrev={() => setRequestPage((current) => Math.max(1, current - 1))}
            onNext={() => setRequestPage((current) => current + 1)}
          />
        ) : null}
      </PagePanel>

      <div className="space-y-4">
        {subscriptionPage.rows.map((row) => {
          const draft = getDraft(row);
          const isExpanded = expandedUserId === row.user.id;

          return (
            <PagePanel key={row.user.id} className="space-y-4 bg-white/92">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-black text-slate-900">{row.user.name}</h3>
                    <Badge variant="outline" className={statusTone(row.subscription.status)}>
                      {row.subscription.status.replace("_", " ")}
                    </Badge>
                    <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                      {row.subscription.plan.name}
                    </Badge>
                    <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                      {row.user.role}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">{row.user.email}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <UserRoundCheck className="h-3.5 w-3.5" />
                      {row.subscription.activeDeviceCount} active devices
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Gauge className="h-3.5 w-3.5" />
                      {row.subscription.usage.paperGenerationsUsed} papers this period
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      Ends {formatDate(row.subscription.endsAt)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setExpandedUserId((current) =>
                        current === row.user.id ? null : row.user.id,
                      )
                    }
                  >
                    {isExpanded ? "Hide controls" : "Edit controls"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applyQuickApproval(row, "pro")}
                    disabled={saveMutation.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve Pro
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applyQuickApproval(row, "premium")}
                    disabled={saveMutation.isPending}
                  >
                    <Sparkles className="h-4 w-4" />
                    Approve Premium
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applyQuickApproval(row, "free")}
                    disabled={saveMutation.isPending}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Revert Free
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                <SummaryCard
                  label="Current devices"
                  value={`${row.subscription.activeDeviceCount}/${row.subscription.limits.deviceLimit}`}
                  note="Active / allowed"
                />
                <SummaryCard
                  label="Practice cap"
                  value={
                    row.subscription.limits.maxQuestionsPerPractice == null
                      ? "Plan cap"
                      : `${row.subscription.limits.maxQuestionsPerPractice}`
                  }
                  note="Questions per session"
                />
                <SummaryCard
                  label="Paper cap"
                  value={
                    row.subscription.limits.maxQuestionsPerPaper == null
                      ? "Plan cap"
                      : `${row.subscription.limits.maxQuestionsPerPaper}`
                  }
                  note="Questions per paper"
                />
                <SummaryCard
                  label="Paper usage"
                  value={`${row.subscription.usage.paperGenerationsUsed}`}
                  note="This billing period"
                />
                <SummaryCard
                  label="Swap usage"
                  value={`${row.subscription.usage.paperSwapsUsed}`}
                  note="This billing period"
                />
                <SummaryCard
                  label="PDF usage"
                  value={`${row.subscription.usage.pdfExportsUsed}`}
                  note="This billing period"
                />
              </div>

              {isExpanded ? (
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <FormSelect
                      label="Plan"
                      value={draft.planCode}
                      onValueChange={(value) =>
                        setDraftField(
                          row.user.id,
                          row,
                          "planCode",
                          value as PlanCode,
                        )
                      }
                      options={plansQuery.data.map((plan) => ({
                        value: plan.code,
                        label: plan.name,
                      }))}
                    />
                    <FormSelect
                      label="Status"
                      value={draft.status}
                      onValueChange={(value) =>
                        setDraftField(
                          row.user.id,
                          row,
                          "status",
                          value as SubscriptionStatus,
                        )
                      }
                      options={[
                        { value: "active", label: "Active" },
                        { value: "past_due", label: "Past due" },
                        { value: "canceled", label: "Canceled" },
                        { value: "expired", label: "Expired" },
                      ]}
                    />
                    <FormSelect
                      label="Billing cycle"
                      value={draft.billingCycle}
                      onValueChange={(value) =>
                        setDraftField(
                          row.user.id,
                          row,
                          "billingCycle",
                          value as BillingCycle,
                        )
                      }
                      options={[
                        { value: "monthly", label: "Monthly" },
                        { value: "yearly", label: "Yearly" },
                        { value: "lifetime", label: "Lifetime" },
                      ]}
                    />
                    <div className="space-y-2">
                      <Label htmlFor={`ends-at-${row.user.id}`}>Ends at</Label>
                      <Input
                        id={`ends-at-${row.user.id}`}
                        type="date"
                        value={draft.endsAt}
                        onChange={(event) =>
                          setDraftField(row.user.id, row, "endsAt", event.target.value)
                        }
                      />
                    </div>

                    <OverrideInput
                      id={`device-${row.user.id}`}
                      label="Device override"
                      placeholder={`${row.subscription.defaults.deviceLimit}`}
                      value={draft.deviceLimitOverride}
                      onChange={(value) =>
                        setDraftField(row.user.id, row, "deviceLimitOverride", value)
                      }
                    />
                    <OverrideInput
                      id={`practice-${row.user.id}`}
                      label="Practice override"
                      placeholder={placeholderFor(row.subscription.defaults.maxQuestionsPerPractice)}
                      value={draft.maxQuestionsPerPracticeOverride}
                      onChange={(value) =>
                        setDraftField(
                          row.user.id,
                          row,
                          "maxQuestionsPerPracticeOverride",
                          value,
                        )
                      }
                    />
                    <OverrideInput
                      id={`paper-${row.user.id}`}
                      label="Paper override"
                      placeholder={placeholderFor(row.subscription.defaults.maxQuestionsPerPaper)}
                      value={draft.maxQuestionsPerPaperOverride}
                      onChange={(value) =>
                        setDraftField(
                          row.user.id,
                          row,
                          "maxQuestionsPerPaperOverride",
                          value,
                        )
                      }
                    />
                    <OverrideInput
                      id={`pdf-${row.user.id}`}
                      label="PDF override"
                      placeholder={placeholderFor(row.subscription.defaults.monthlyPdfExportLimit)}
                      value={draft.monthlyPdfExportLimitOverride}
                      onChange={(value) =>
                        setDraftField(
                          row.user.id,
                          row,
                          "monthlyPdfExportLimitOverride",
                          value,
                        )
                      }
                    />
                    <OverrideInput
                      id={`generation-${row.user.id}`}
                      label="Generation override"
                      placeholder={placeholderFor(
                        row.subscription.defaults.monthlyPaperGenerationLimit,
                      )}
                      value={draft.monthlyPaperGenerationLimitOverride}
                      onChange={(value) =>
                        setDraftField(
                          row.user.id,
                          row,
                          "monthlyPaperGenerationLimitOverride",
                          value,
                        )
                      }
                    />
                    <OverrideInput
                      id={`swap-${row.user.id}`}
                      label="Swap override"
                      placeholder={placeholderFor(row.subscription.defaults.monthlyPaperSwapLimit)}
                      value={draft.monthlyPaperSwapLimitOverride}
                      onChange={(value) =>
                        setDraftField(
                          row.user.id,
                          row,
                          "monthlyPaperSwapLimitOverride",
                          value,
                        )
                      }
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() =>
                        void saveMutation.mutateAsync({
                          userId: row.user.id,
                          input: toSubmitInput(draft),
                        })
                      }
                      disabled={saveMutation.isPending}
                    >
                      Save subscription
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setDrafts((current) => ({
                          ...current,
                          [row.user.id]: toDraft(row),
                        }))
                      }
                    >
                      Reset changes
                    </Button>
                  </div>
                </div>
              ) : null}
            </PagePanel>
          );
        })}
      </div>

      <PagePanel className="bg-white/88">
        <PaginationControls
          page={subscriptionPage.page}
          totalPages={Math.max(1, Math.ceil(subscriptionPage.total / subscriptionPage.pageSize))}
          totalRows={subscriptionPage.total}
          from={from}
          to={to}
          pageSize={subscriptionPage.pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          onPageSizeChange={(nextSize) => {
            void navigate({
              to: Route.to,
              search: {
                page: DEFAULT_PAGE,
                search: search.search,
                planCode: search.planCode,
                status: search.status,
                pageSize: nextSize,
              },
            });
          }}
          onPrev={() => {
            void navigate({
              to: Route.to,
              search: {
                page: Math.max(1, page - 1),
                pageSize,
                search: search.search,
                planCode: search.planCode,
                status: search.status,
              },
            });
          }}
          onNext={() => {
            void navigate({
              to: Route.to,
              search: {
                page: page + 1,
                pageSize,
                search: search.search,
                planCode: search.planCode,
                status: search.status,
              },
            });
          }}
        />
      </PagePanel>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  note,
  tone = "slate",
}: {
  label: string;
  value: string;
  note: string;
  tone?: "slate" | "emerald" | "amber" | "sky";
}) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50/80"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50/80"
        : tone === "sky"
          ? "border-sky-200 bg-sky-50/80"
          : "border-slate-200 bg-white/80";

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-xl font-black text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{note}</p>
    </div>
  );
}

function FormSelect({
  label,
  value,
  onValueChange,
  options,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function OverrideInput({
  id,
  label,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={1}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function placeholderFor(value: number | null) {
  return value == null ? "Plan cap" : String(value);
}

function RequestCard({
  request,
  note,
  onNoteChange,
  onApprove,
  onReject,
  disabled,
}: {
  request: AdminSubscriptionRequest;
  note: string;
  onNoteChange: (value: string) => void;
  onApprove: () => void;
  onReject: () => void;
  disabled: boolean;
}) {
  const [showProof, setShowProof] = useState(false);
  const requestDetailQuery = useQuery({
    queryKey: ["admin-subscription-request", request.id],
    queryFn: () => subscriptionApi.getRequestDetail(request.id),
    enabled: showProof && request.hasPaymentProof === true,
  });
  const proofRequest =
    requestDetailQuery.data && "data" in requestDetailQuery.data
      ? requestDetailQuery.data.data
      : null;
  const paymentProofImageDataUrl =
    proofRequest?.paymentProofImageDataUrl ?? null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-slate-900">{request.user?.name ?? "Unknown user"}</p>
            <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
              {request.requestedPlanCode}
            </Badge>
            <Badge variant="outline" className={requestStatusTone(request.status)}>
              {request.status}
            </Badge>
          </div>
          <p className="text-sm text-slate-500">{request.user?.email ?? "No email"}</p>
          <p className="text-xs text-slate-500">
            Requested {new Date(request.createdAt).toLocaleString()}
          </p>
          {request.transactionId ? (
            <p className="text-sm font-medium text-slate-700">
              Transaction ID: {request.transactionId}
            </p>
          ) : null}
          {request.note ? (
            <p className="text-sm text-slate-700">User note: {request.note}</p>
          ) : null}
          {request.adminNote && request.status !== "pending" ? (
            <p className="text-sm text-slate-700">Admin note: {request.adminNote}</p>
          ) : null}
          {request.reviewedAt ? (
            <p className="text-xs text-slate-500">
              Reviewed {new Date(request.reviewedAt).toLocaleString()}
              {request.reviewer?.name ? ` by ${request.reviewer.name}` : ""}
            </p>
          ) : null}
        </div>

        {request.status === "pending" ? (
          <div className="flex gap-2">
            <Button size="sm" onClick={onApprove} disabled={disabled}>
              Approve
            </Button>
            <Button size="sm" variant="outline" onClick={onReject} disabled={disabled}>
              Reject
            </Button>
          </div>
        ) : null}
      </div>

      {request.hasPaymentProof ? (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-sm text-slate-600">Payment proof attached</p>
            <Button
              size="sm"
              variant="outline"
              className="bg-white"
              onClick={() => setShowProof((current) => !current)}
            >
              {showProof ? "Hide proof" : "View proof"}
            </Button>
          </div>
          {showProof ? (
            requestDetailQuery.isLoading ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                Loading payment proof...
              </div>
            ) : requestDetailQuery.data && !requestDetailQuery.data.ok ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
                {requestDetailQuery.data.message}
              </div>
            ) : paymentProofImageDataUrl ? (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <img
                  src={paymentProofImageDataUrl}
                  alt={`Payment proof for ${request.user?.name ?? "request"}`}
                  className="h-56 w-full object-contain"
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                No payment proof image found for this request.
              </div>
            )
          ) : null}
        </div>
      ) : null}

      {request.status === "pending" ? (
        <div className="mt-3 space-y-2">
          <Label htmlFor={`request-note-${request.id}`}>Admin note</Label>
          <Input
            id={`request-note-${request.id}`}
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder="Optional note back to the user"
          />
        </div>
      ) : null}
    </div>
  );
}
