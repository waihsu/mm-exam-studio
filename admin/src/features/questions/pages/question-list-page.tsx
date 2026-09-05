import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { PaginationControls } from "@/components/data-table/pagination-controls";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PagePanel } from "@/components/page-container";
import { toast } from "@/components/ui/sonner";
import { QuestionFilterBar } from "@/features/questions/components/question-filter-bar";
import { QuestionSummaryCards } from "@/features/questions/components/question-summary-cards";
import { QuestionTable } from "@/features/questions/components/question-table";
import { questionApi } from "@/features/questions/api/question.api";
import {
  DEFAULT_QUESTION_PAGE,
  DEFAULT_QUESTION_PAGE_SIZE,
  QUESTION_PAGE_SIZE_OPTIONS,
  toQuestionFilters,
  toQuestionListSearch,
  type QuestionListSearch,
} from "@/features/questions/question-list-search";
import type { QuestionRecord } from "@/features/questions/types/question.type";

type QuestionListPageProps = {
  search: QuestionListSearch;
};

export function QuestionListPage({ search }: QuestionListPageProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const filters = toQuestionFilters(search);

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
  const page = questionPage?.page ?? filters.page ?? DEFAULT_QUESTION_PAGE;
  const pageSize = questionPage?.pageSize ?? filters.pageSize ?? DEFAULT_QUESTION_PAGE_SIZE;
  const totalPages = questionPage?.totalPages ?? 1;
  const totalRows = questionPage?.total ?? 0;
  const from = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = totalRows === 0 ? 0 : Math.min((page - 1) * pageSize + questions.length, totalRows);

  return (
    <div className="space-y-4">
      {errorMessage ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Question bank unavailable</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <PagePanel className="space-y-4">
        <QuestionFilterBar
          filters={filters}
          meta={metaQuery.data}
          onChange={(next) => {
            void navigate({
              to: "/questions",
              search: toQuestionListSearch({
                ...next,
                page: DEFAULT_QUESTION_PAGE,
              }),
              replace: true,
            });
          }}
          onReset={() => {
            void navigate({
              to: "/questions",
              search: {},
              replace: true,
            });
          }}
        />
      </PagePanel>

      <QuestionSummaryCards
        total={totalRows}
        published={questionPage?.summary.published ?? 0}
        draft={questionPage?.summary.draft ?? 0}
        variable={questionPage?.summary.variable ?? 0}
      />

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

      <PagePanel>
        <PaginationControls
          page={page}
          totalPages={totalPages}
          totalRows={totalRows}
          from={from}
          to={to}
          pageSize={pageSize}
          pageSizeOptions={QUESTION_PAGE_SIZE_OPTIONS}
          onPageSizeChange={(nextSize) => {
            void navigate({
              to: "/questions",
              search: toQuestionListSearch({
                ...filters,
                page: DEFAULT_QUESTION_PAGE,
                pageSize: nextSize,
              }),
              replace: true,
            });
          }}
          onPrev={() => {
            void navigate({
              to: "/questions",
              search: toQuestionListSearch({
                ...filters,
                page: Math.max(DEFAULT_QUESTION_PAGE, page - 1),
                pageSize,
              }),
              replace: true,
            });
          }}
          onNext={() => {
            void navigate({
              to: "/questions",
              search: toQuestionListSearch({
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
