import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BookText,
  CreditCard,
  Layers3,
  LifeBuoy,
  Settings,
  UsersRound,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/page-shell";
import { PageContainer, PagePanel } from "@/components/page-container";
import { ADMIN_ROUTES } from "@/constants/routes";
import { useAuthFlow } from "@/features/auth/hooks/use-auth-flow";
import { blueprintApi } from "@/features/blueprints/api/blueprint.api";
import { subscriptionApi } from "@/features/subscriptions/api/subscription.api";
import { supportApi } from "@/features/support/api/support.api";
import { usersApi } from "@/features/users/api/users.api";

export const Route = createFileRoute("/_protected/dashboard")({
  component: DashboardPage,
});

const formatDateTime = (value: string | null) =>
  value ? new Date(value).toLocaleString() : "No activity yet";

const relativeTone = (count: number) =>
  count > 0
    ? "border-amber-200 bg-amber-50 text-amber-800"
    : "border-emerald-200 bg-emerald-50 text-emerald-800";

function DashboardPage() {
  const { user, roles, isSuperAdmin } = useAuthFlow();

  const blueprintsQuery = useQuery({
    queryKey: ["dashboard-blueprints-summary"],
    queryFn: async () => {
      const response = await blueprintApi.getBlueprints();
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
  });

  const subscriptionRequestsQuery = useQuery({
    queryKey: ["dashboard-subscription-requests-summary"],
    queryFn: async () => {
      const response = await subscriptionApi.getRequests({
        page: 1,
        pageSize: 5,
        status: "pending",
      });
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
  });

  const supportQuery = useQuery({
    queryKey: ["dashboard-support-summary"],
    queryFn: async () => {
      const response = await supportApi.getConversations({
        page: 1,
        pageSize: 5,
        status: "open",
      });
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
  });

  const usersQuery = useQuery({
    queryKey: ["dashboard-users-summary"],
    queryFn: async () => {
      const response = await usersApi.getDirectory({
        page: 1,
        pageSize: 1,
      });
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
  });

  const activeSubscriptionsQuery = useQuery({
    queryKey: ["dashboard-active-subscriptions-summary"],
    queryFn: async () => {
      const response = await subscriptionApi.getAdminUsers({
        page: 1,
        pageSize: 1,
        status: "active",
      });
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
  });

  const dashboardError =
    (blueprintsQuery.error instanceof Error && blueprintsQuery.error.message) ||
    (subscriptionRequestsQuery.error instanceof Error &&
      subscriptionRequestsQuery.error.message) ||
    (supportQuery.error instanceof Error && supportQuery.error.message) ||
    (usersQuery.error instanceof Error && usersQuery.error.message) ||
    (activeSubscriptionsQuery.error instanceof Error &&
      activeSubscriptionsQuery.error.message) ||
    null;

  const blueprintRows = blueprintsQuery.data?.rows ?? [];
  const pendingRequests = subscriptionRequestsQuery.data?.rows ?? [];
  const openConversations = supportQuery.data?.rows ?? [];
  const publishedTemplateCount = blueprintRows.filter(
    (row) => row.templateConfig.isPublished,
  ).length;
  const readyBlueprintCount = blueprintRows.filter(
    (row) => row.status === "ready",
  ).length;
  const draftBlueprintCount = blueprintRows.filter(
    (row) => row.status === "draft",
  ).length;

  const summaryCards = [
    {
      title: "Users",
      value: usersQuery.data?.total ?? 0,
      caption: "Accounts in the admin directory",
      tone: "border-slate-200 bg-white text-slate-900",
      to: ADMIN_ROUTES.users,
      icon: UsersRound,
    },
    {
      title: "Published templates",
      value: publishedTemplateCount,
      caption: `${readyBlueprintCount} ready blueprints`,
      tone: "border-cyan-200 bg-cyan-50 text-cyan-900",
      to: ADMIN_ROUTES.questionBlueprints,
      icon: Layers3,
    },
    {
      title: "Pending subscriptions",
      value: subscriptionRequestsQuery.data?.total ?? 0,
      caption: "Needs manual review",
      tone: "border-amber-200 bg-amber-50 text-amber-900",
      to: ADMIN_ROUTES.userSubscriptions,
      icon: CreditCard,
    },
    {
      title: "Open support threads",
      value: supportQuery.data?.total ?? 0,
      caption: "Waiting in the inbox",
      tone: "border-emerald-200 bg-emerald-50 text-emerald-900",
      to: ADMIN_ROUTES.userSupport,
      icon: LifeBuoy,
    },
  ] as const;

  const quickActions = [
    {
      title: "Question bank",
      detail: "Review, publish, and clean up the core bank.",
      to: ADMIN_ROUTES.questions,
      icon: BookText,
    },
    {
      title: "Blueprint templates",
      detail: "Shape reusable paper generation flows for each plan.",
      to: ADMIN_ROUTES.questionBlueprints,
      icon: Layers3,
    },
    {
      title: "Subscription queue",
      detail: "Approve or reject plan upgrade requests quickly.",
      to: ADMIN_ROUTES.userSubscriptions,
      icon: CreditCard,
    },
    {
      title: "Support inbox",
      detail: "Reply to user threads without leaving admin operations.",
      to: ADMIN_ROUTES.userSupport,
      icon: LifeBuoy,
    },
  ] as const;

  return (
    <PageContainer className="space-y-4 sm:space-y-6">
      <AdminPageHeader
        eyebrow="Admin Operations"
        title={`Welcome back${user?.name ? `, ${user.name}` : ""}.`}
        description="Start from the queues that need attention, then jump into content, templates, or user management without digging through menus."
        className="overflow-hidden bg-slate-950 text-white"
        inverted
        chips={
          <>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-slate-200">
              Roles: {roles.join(", ") || "none"}
            </span>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-slate-200">
              Access: {isSuperAdmin ? "Superadmin" : "Admin"}
            </span>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-slate-200">
              Active subscriptions: {activeSubscriptionsQuery.data?.total ?? 0}
            </span>
          </>
        }
        actions={
          <div className="grid gap-2 sm:grid-cols-2 lg:w-[360px]">
            {summaryCards.slice(2).map((item) => (
              <Link
                key={item.title}
                to={item.to}
                className="rounded-2xl border border-white/12 bg-white/8 p-3 transition hover:bg-white/12"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-slate-200">{item.title}</span>
                  <item.icon className="h-4 w-4 text-cyan-100" />
                </div>
                <p className="mt-2 text-2xl font-black text-white">{item.value}</p>
                <p className="mt-1 text-xs text-slate-300">{item.caption}</p>
              </Link>
            ))}
          </div>
        }
      />

      {dashboardError ? (
        <Alert variant="destructive">
          <AlertTitle>Dashboard data could not load</AlertTitle>
          <AlertDescription>{dashboardError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => {
          const Icon = item.icon;
          return (
            <PagePanel key={item.title} className={`space-y-3 ${item.tone}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] opacity-70">
                    {item.title}
                  </p>
                  <p className="text-3xl font-black tracking-tight">{item.value}</p>
                </div>
                <div className="rounded-2xl bg-white/70 p-3 shadow-sm">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="text-sm leading-6 opacity-80">{item.caption}</p>
              <Button
                asChild
                variant="outline"
                className="border-current/20 bg-white/80 text-current hover:bg-white"
              >
                <Link to={item.to}>
                  Open section
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </PagePanel>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <PagePanel className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Needs attention
              </p>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">
                Review queues
              </h2>
            </div>
            <Badge className={relativeTone(pendingRequests.length + openConversations.length)}>
              {pendingRequests.length + openConversations.length} waiting now
            </Badge>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/85 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Subscription requests
                  </h3>
                  <p className="text-sm text-slate-600">
                    Pending upgrades that still need a decision.
                  </p>
                </div>
                <Badge className={relativeTone(pendingRequests.length)}>
                  {subscriptionRequestsQuery.data?.total ?? 0}
                </Badge>
              </div>

              <div className="space-y-2">
                {pendingRequests.length > 0 ? (
                  pendingRequests.map((request) => (
                    <Link
                      key={request.id}
                      to={ADMIN_ROUTES.userSubscriptions}
                      className="block rounded-xl border border-slate-200 bg-white px-3 py-3 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {request.user?.name || request.user?.email || "Unknown user"}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {request.user?.email || "No email"}
                          </p>
                        </div>
                        <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                          {request.requestedPlanCode}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        Requested {formatDateTime(request.createdAt)}
                      </p>
                    </Link>
                  ))
                ) : (
                  <p className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50 px-3 py-4 text-sm text-emerald-800">
                    No pending subscription reviews right now.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/85 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Support inbox</h3>
                  <p className="text-sm text-slate-600">
                    Open conversations waiting for admin replies.
                  </p>
                </div>
                <Badge className={relativeTone(openConversations.length)}>
                  {supportQuery.data?.total ?? 0}
                </Badge>
              </div>

              <div className="space-y-2">
                {openConversations.length > 0 ? (
                  openConversations.map((conversation) => (
                    <Link
                      key={conversation.id}
                      to={ADMIN_ROUTES.userSupport}
                      search={{ conversationId: conversation.id }}
                      className="block rounded-xl border border-slate-200 bg-white px-3 py-3 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {conversation.user?.name || conversation.user?.email || "Unknown user"}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {conversation.subject || "Support thread"}
                          </p>
                        </div>
                        <Badge className="border-cyan-200 bg-cyan-50 text-cyan-700">
                          {conversation.unreadForAdminCount} unread
                        </Badge>
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs text-slate-500">
                        {conversation.lastMessagePreview || "No preview available"}
                      </p>
                    </Link>
                  ))
                ) : (
                  <p className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50 px-3 py-4 text-sm text-emerald-800">
                    No open support threads are waiting right now.
                  </p>
                )}
              </div>
            </div>
          </div>
        </PagePanel>

        <div className="space-y-4">
          <PagePanel className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Content health
                </p>
                <h2 className="text-2xl font-black tracking-tight text-slate-900">
                  Blueprint inventory
                </h2>
              </div>
              <Badge className={draftBlueprintCount > 0
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"}>
                {draftBlueprintCount} need setup
              </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Total
                </p>
                <p className="mt-2 text-2xl font-black text-slate-900">
                  {blueprintRows.length}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Ready
                </p>
                <p className="mt-2 text-2xl font-black text-slate-900">
                  {readyBlueprintCount}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Published
                </p>
                <p className="mt-2 text-2xl font-black text-slate-900">
                  {publishedTemplateCount}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {blueprintRows.slice(0, 4).map((row) => (
                <Link
                  key={row.id}
                  to={ADMIN_ROUTES.questionBlueprints}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {row.title}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {row.grade.name} • {row.subject.name} • {row.mode}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        row.status === "ready"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : row.status === "draft"
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : "border-slate-200 bg-slate-100 text-slate-700"
                      }
                    >
                      {row.status}
                    </Badge>
                    {row.templateConfig.isPublished ? (
                      <Badge className="border-cyan-200 bg-cyan-50 text-cyan-700">
                        template
                      </Badge>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          </PagePanel>

          <PagePanel className="space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Quick actions
              </p>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">
                Jump into work
              </h2>
            </div>

            <div className="space-y-3">
              {quickActions.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <div className="flex min-w-0 gap-3">
                      <div className="rounded-2xl bg-slate-900 p-3 text-white">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          {item.title}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {item.detail}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                  </Link>
                );
              })}

              <Link
                to={ADMIN_ROUTES.settingsSecurity}
                className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-slate-300 hover:bg-white"
              >
                <div className="flex min-w-0 gap-3">
                  <div className="rounded-2xl bg-white p-3 text-slate-900 shadow-sm">
                    <Settings className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Security settings
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Review sessions, audit logs, and auth controls.
                    </p>
                  </div>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
              </Link>
            </div>
          </PagePanel>
        </div>
      </div>
    </PageContainer>
  );
}
