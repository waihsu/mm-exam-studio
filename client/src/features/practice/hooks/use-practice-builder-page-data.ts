import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { workspaceApi } from "@/features/workspace/api/workspace-api";
import type { WorkspaceFilters } from "@/features/workspace/types";

const DEFAULT_FILTERS: WorkspaceFilters = {
  search: "",
  gradeId: "",
  subjectId: "",
  chapterId: "",
  subChapterId: "",
};

export function usePracticeBuilderPageData() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<WorkspaceFilters>(DEFAULT_FILTERS);
  const [generatorMode, setGeneratorMode] = useState<"all_questions" | "mcq_only">(
    "all_questions",
  );
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const metaQuery = useQuery({
    queryKey: ["workspace-meta"],
    queryFn: () => workspaceApi.getMeta(),
  });
  const catalogQuery = useQuery({
    queryKey: ["workspace-catalog", filters, generatorMode, page],
    queryFn: () =>
      workspaceApi.getCatalog({
        ...filters,
        questionType: generatorMode === "mcq_only" ? "mcq" : undefined,
        page,
        pageSize: 20,
      }),
  });
  const sessionsQuery = useQuery({
    queryKey: ["workspace-practice-sessions"],
    queryFn: () => workspaceApi.listPracticeSessions(),
  });
  const summaryQuery = useQuery({
    queryKey: ["workspace-summary"],
    queryFn: () => workspaceApi.getSummary(),
  });

  const createSessionMutation = useMutation({
    mutationFn: () =>
      workspaceApi.createPracticeSession({
        ...filters,
        generatorMode,
        questionIds: selectedQuestionIds,
      }),
    onSuccess: async (response) => {
      if (!response.ok) return;
      await navigate({
        to: "/practice/$sessionId",
        params: { sessionId: response.data.id },
      });
    },
  });

  const meta = metaQuery.data?.ok ? metaQuery.data.data : undefined;
  const catalog = catalogQuery.data?.ok ? catalogQuery.data.data : undefined;
  const lockedRows = catalog?.lockedRows ?? [];
  const lockedTotal = catalog?.lockedTotal ?? 0;
  const sessions = sessionsQuery.data?.ok ? sessionsQuery.data.data.rows : [];
  const summary = summaryQuery.data?.ok ? summaryQuery.data.data : undefined;
  const planCode = summary?.subscription.code;
  const questionLimit = summary?.subscription.limits.maxQuestionsPerPractice ?? null;

  const selectedCount = selectedQuestionIds.length;
  const activeSessionsCount = sessions.filter((session) => session.status === "active").length;
  const exceedsLimit = typeof questionLimit === "number" ? selectedCount > questionLimit : false;

  const selectionLabel = useMemo(() => {
    if (selectedCount === 0) return "Select questions to begin";
    return `${selectedCount} question${selectedCount > 1 ? "s" : ""} selected`;
  }, [selectedCount]);

  const toggleQuestion = (questionId: string) => {
    setSelectedQuestionIds((current) =>
      current.includes(questionId)
        ? current.filter((id) => id !== questionId)
        : [...current, questionId],
    );
  };

  const clearSelection = () => setSelectedQuestionIds([]);

  const updateMode = (mode: "all_questions" | "mcq_only") => {
    setPage(1);
    clearSelection();
    setGeneratorMode(mode);
  };

  const updateFilters = (next: WorkspaceFilters) => {
    setPage(1);
    clearSelection();
    setFilters(next);
  };

  const startPractice = async () => {
    await createSessionMutation.mutateAsync();
  };

  return {
    filters,
    generatorMode,
    page,
    metaQuery,
    catalogQuery,
    sessionsQuery,
    summaryQuery,
    createSessionMutation,
    meta,
    catalog,
    lockedRows,
    lockedTotal,
    sessions,
    summary,
    planCode,
    questionLimit,
    selectedQuestionIds,
    selectedCount,
    activeSessionsCount,
    exceedsLimit,
    selectionLabel,
    setPage,
    updateMode,
    updateFilters,
    toggleQuestion,
    clearSelection,
    startPractice,
  };
}
