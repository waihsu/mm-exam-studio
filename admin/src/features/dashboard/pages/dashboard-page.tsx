import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, BookText, LifeBuoy, UsersRound } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/page-shell";
import { PageContainer, PagePanel } from "@/components/page-container";
import { ADMIN_ROUTES } from "@/constants/routes";
import { useAuthFlow } from "@/features/auth/hooks/use-auth-flow";
import { DashboardQuickActions } from "@/features/dashboard/components/dashboard-quick-actions";
import { DashboardSupportQueue } from "@/features/dashboard/components/dashboard-support-queue";
import { supportApi } from "@/features/support/api/support.api";
import { usersApi } from "@/features/users/api/users.api";

const relativeTone = (count: number) =>
  count > 0
    ? "border-[#ead1c3] bg-[#f5e4da] text-[#8f4437]"
    : "border-[#c9dcd3] bg-[#e7efe9] text-[#2b554d]";

export function DashboardPage() {
  const { user, isSuperAdmin } = useAuthFlow();

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

  const dashboardError =
    (supportQuery.error instanceof Error && supportQuery.error.message) ||
    (usersQuery.error instanceof Error && usersQuery.error.message) ||
    null;

  const openConversations = supportQuery.data?.rows ?? [];

  const summaryCards = [
    {
      title: "Users",
      value: usersQuery.data?.total ?? 0,
      caption: "Accounts in the admin directory",
      tone: "border-[#d8d4c9] bg-[#fffdf8] text-[#202321]",
      to: ADMIN_ROUTES.users,
      icon: UsersRound,
    },
    {
      title: "Open support threads",
      value: supportQuery.data?.total ?? 0,
      caption: "Waiting in the inbox",
      tone: "border-[#d8d4c9] bg-[#fffdf8] text-[#202321]",
      to: ADMIN_ROUTES.userSupport,
      icon: LifeBuoy,
    },
  ] as const;

  return (
    <PageContainer className="space-y-4 sm:space-y-6">
      <AdminPageHeader
        eyebrow="Admin Operations"
        title="Operations overview"
        description="Start with content, learners, and support work waiting for a decision."
        chips={
          <>
            <span className="rounded-full border border-[#d8d4c9] bg-[#f8f5ee] px-3 py-1.5 text-xs font-medium text-[#6e706b]">
              Signed in as {user?.name || user?.email || "Admin"}
            </span>
            <span className="rounded-full border border-[#d8d4c9] bg-[#f8f5ee] px-3 py-1.5 text-xs font-medium text-[#6e706b]">
              Access: {isSuperAdmin ? "Superadmin" : "Admin"}
            </span>
          </>
        }
        actions={
          <Button asChild>
            <Link to={ADMIN_ROUTES.questions}>
              <BookText className="mr-2 h-4 w-4" />
              Open question bank
            </Link>
          </Button>
        }
      />

      {dashboardError ? (
        <Alert variant="destructive">
          <AlertTitle>Dashboard data could not load</AlertTitle>
          <AlertDescription>{dashboardError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map(item => {
          const Icon = item.icon;
          return (
            <PagePanel key={item.title} className={`space-y-3 ${item.tone}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="admin-kicker opacity-65">{item.title}</p>
                  <p className="text-2xl font-bold tracking-tight">
                    {item.value}
                  </p>
                </div>
                <div className="rounded-xl border border-[#d8d4c9] bg-[#e7efe9] p-2.5 text-[#48766b]">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-sm leading-5 text-[#6e706b]">{item.caption}</p>
              <Button
                asChild
                variant="outline"
                className="w-full border-[#d8d4c9] bg-[#fffdf8] text-[#202321] hover:bg-[#f8f5ee]"
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
        <DashboardSupportQueue
          conversations={openConversations}
          total={supportQuery.data?.total ?? 0}
          waitingBadgeClassName={relativeTone(openConversations.length)}
        />

        <DashboardQuickActions />
      </div>
    </PageContainer>
  );
}
