import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Boxes, FileStack, FlaskConical, Send } from "lucide-react";
import { PaginationControls } from "@/components/data-table/pagination-controls";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PagePanel } from "@/components/page-container";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { QuestionFilterBar } from "@/features/questions/components/question-filter-bar";
import { QuestionTable } from "@/features/questions/components/question-table";
import { questionApi } from "@/features/questions/api/question.api";
import type { QuestionFilters, QuestionMode, QuestionRecord } from "@/features/questions/types/question.type";

type QuestionListSearch = {
  search?: string;
  gradeId?: string;
  subjectId?: string;
  chapterId?: string;
  subChapterId?: string;
  type?: "mcq" | "true_false" | "short_answer" | "long_answer" | "fill_blank" | "matching";
  mode?: QuestionMode;
  difficulty?: "easy" | "medium" | "hard";
  isPublished?: "true" | "false";
  page?: number;
  pageSize?: number;
};

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const toFilters = (search: QuestionListSearch): QuestionFilters => ({
  search: search.search,
  gradeId: search.gradeId,
  subjectId: search.subjectId,
  chapterId: search.chapterId,
  subChapterId: search.subChapterId,
  type: search.type,
  mode: search.mode,
  difficulty: search.difficulty,
  isPublished:
    search.isPublished === "true"
      ? true
      : search.isPublished === "false"
        ? false
        : undefined,
  page: search.page ?? DEFAULT_PAGE,
  pageSize: search.pageSize ?? DEFAULT_PAGE_SIZE,
});

const toSearch = (filters: QuestionFilters): QuestionListSearch => ({
  search: filters.search || undefined,
  gradeId: filters.gradeId || undefined,
  subjectId: filters.subjectId || undefined,
  chapterId: filters.chapterId || undefined,
  subChapterId: filters.subChapterId || undefined,
  type: filters.type,
  mode: filters.mode,
  difficulty: filters.difficulty,
  isPublished:
    typeof filters.isPublished === "boolean"
      ? String(filters.isPublished) as "true" | "false"
      : undefined,
  page:
    filters.page && filters.page > DEFAULT_PAGE ? filters.page : undefined,
  pageSize:
    filters.pageSize && filters.pageSize !== DEFAULT_PAGE_SIZE
      ? filters.pageSize
      : undefined,
});

export const Route = createFileRoute("/_protected/questions/")({
  validateSearch: (search): QuestionListSearch => ({
    search: typeof search.search === "string" ? search.search : undefined,
    gradeId: typeof search.gradeId === "string" ? search.gradeId : undefined,
    subjectId: typeof search.subjectId === "string" ? search.subjectId : undefined,
    chapterId: typeof search.chapterId === "string" ? search.chapterId : undefined,
    subChapterId:
      typeof search.subChapterId === "string" ? search.subChapterId : undefined,
    type:
      search.type === "mcq" ||
      search.type === "true_false" ||
      search.type === "short_answer" ||
      search.type === "long_answer" ||
      search.type === "fill_blank" ||
      search.type === "matching"
        ? search.type
        : undefined,
    mode:
      search.mode === "static" || search.mode === "variable"
        ? search.mode
        : undefined,
    difficulty:
      search.difficulty === "easy" ||
      search.difficulty === "medium" ||
      search.difficulty === "hard"
        ? search.difficulty
        : undefined,
    isPublished:
      search.isPublished === "true" || search.isPublished === "false"
        ? search.isPublished
        : undefined,
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
  }),
  component: QuestionListPage,
});

function QuestionListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const search = Route.useSearch();
  const filters = toFilters(search);

  const metaQuery = useQuery({
    queryKey: ["question-meta"],
    queryFn: async () => {
      const response = await questionApi.getMeta();
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
  });

  const questionsQuery = useQuery({
    queryKey: ["questions", filters],
    queryFn: async () => {
      const response = await questionApi.getQuestions(filters);
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
    placeholderData: (previousData) => previousData,
  });

  const duplicateMutation = useMutation({
    mutationFn: async (question: QuestionRecord) => {
      const response = await questionApi.duplicateQuestion(question.id);
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onSuccess: async (question) => {
      toast.success(`Duplicated as ${question.questionCode}`);
      await queryClient.invalidateQueries({ queryKey: ["questions"] });
      await navigate({ to: `/questions/${question.id}/edit` });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to duplicate question",
      );
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (question: QuestionRecord) => {
      const nextIsPublished = !question.isPublished;
      const response = await questionApi.updateQuestion(question.id, {
        isPublished: nextIsPublished,
        ...(nextIsPublished ? { reviewStatus: "approved" as const } : {}),
      });
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onSuccess: async (question) => {
      toast.success(
        question.isPublished ? "Question published" : "Question moved to draft",
      );
      await queryClient.invalidateQueries({ queryKey: ["questions"] });
      await queryClient.invalidateQueries({ queryKey: ["question", question.id] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update question status",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (question: QuestionRecord) => {
      const response = await questionApi.deleteQuestion(question.id);
      if (!response.ok) {
        throw new Error(response.message);
      }
      return question;
    },
    onSuccess: async (question) => {
      toast.success("Question deleted");
      await queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.removeQueries({ queryKey: ["question", question.id] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete question",
      );
    },
  });

  const errorMessage =
    (metaQuery.error instanceof Error && metaQuery.error.message) ||
    (questionsQuery.error instanceof Error && questionsQuery.error.message) ||
    null;
  const questionPage = questionsQuery.data;
  const questions = questionPage?.rows ?? [];
  const page = questionPage?.page ?? filters.page ?? DEFAULT_PAGE;
  const pageSize = questionPage?.pageSize ?? filters.pageSize ?? DEFAULT_PAGE_SIZE;
  const totalPages = questionPage?.totalPages ?? 1;
  const totalRows = questionPage?.total ?? 0;
  const from = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = totalRows === 0 ? 0 : Math.min((page - 1) * pageSize + questions.length, totalRows);
  const summaryCards = [
    {
      key: "total",
      label: "Total questions",
      value: totalRows,
      icon: Boxes,
      tone: "border-slate-200 bg-white/90 text-slate-900",
    },
    {
      key: "published",
      label: "Published",
      value: questionPage?.summary.published ?? 0,
      icon: Send,
      tone: "border-emerald-200 bg-emerald-50/80 text-emerald-950",
    },
    {
      key: "draft",
      label: "Draft",
      value: questionPage?.summary.draft ?? 0,
      icon: FileStack,
      tone: "border-amber-200 bg-amber-50/80 text-amber-950",
    },
    {
      key: "variable",
      label: "Variable",
      value: questionPage?.summary.variable ?? 0,
      icon: FlaskConical,
      tone: "border-sky-200 bg-sky-50/80 text-sky-950",
    },
  ] as const;

  return (
    <div className="space-y-4">
      {errorMessage ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Question bank unavailable</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <PagePanel className="space-y-4 bg-white/88">
        <QuestionFilterBar
          filters={filters}
          meta={metaQuery.data}
          onChange={(next) => {
            void navigate({
              to: Route.to,
              search: toSearch({
                ...next,
                page: DEFAULT_PAGE,
              }),
              replace: true,
            });
          }}
          onReset={() => {
            void navigate({
              to: Route.to,
              search: {},
              replace: true,
            });
          }}
        />
      </PagePanel>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.key} className={card.tone}>
              <CardContent className="flex items-start justify-between p-5">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-70">
                    {card.label}
                  </p>
                  <p className="text-3xl font-black tracking-tight">{card.value}</p>
                </div>
                <div className="rounded-2xl border border-current/10 bg-white/60 p-3">
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <QuestionTable
        questions={questions}
        isLoading={metaQuery.isLoading || questionsQuery.isLoading}
        publishingQuestionId={
          publishMutation.isPending ? (publishMutation.variables?.id ?? null) : null
        }
        duplicatingQuestionId={
          duplicateMutation.isPending ? (duplicateMutation.variables?.id ?? null) : null
        }
        deletingQuestionId={
          deleteMutation.isPending ? (deleteMutation.variables?.id ?? null) : null
        }
        onTogglePublish={async (question) => {
          await publishMutation.mutateAsync(question);
        }}
        onDuplicate={async (question) => {
          await duplicateMutation.mutateAsync(question);
        }}
        onDelete={async (question) => {
          await deleteMutation.mutateAsync(question);
        }}
      />

      <PagePanel className="bg-white/88">
        <PaginationControls
          page={page}
          totalPages={totalPages}
          totalRows={totalRows}
          from={from}
          to={to}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          onPageSizeChange={(nextSize) => {
            void navigate({
              to: Route.to,
              search: toSearch({
                ...filters,
                page: DEFAULT_PAGE,
                pageSize: nextSize,
              }),
              replace: true,
            });
          }}
          onPrev={() => {
            void navigate({
              to: Route.to,
              search: toSearch({
                ...filters,
                page: Math.max(DEFAULT_PAGE, page - 1),
                pageSize,
              }),
              replace: true,
            });
          }}
          onNext={() => {
            void navigate({
              to: Route.to,
              search: toSearch({
                ...filters,
                page: Math.min(totalPages, page + 1),
                pageSize,
              }),
              replace: true,
            });
          }}
        />
      </PagePanel>
    </div>
  );
}
