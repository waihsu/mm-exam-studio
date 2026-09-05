import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { workspaceApi } from "@/features/workspace/api/workspace-api";
import type {
  WorkspaceFilters,
  WorkspaceMeta,
} from "@/features/workspace/types";

const DEFAULT_FILTERS: WorkspaceFilters = {
  search: "",
  gradeId: "",
  subjectId: "",
  chapterId: "",
  subChapterId: "",
};

const SAVED_PRACTICE_SCOPE_KEY = "mm-exam-studio.practice-scope";

const getInitialFilters = (): WorkspaceFilters => {
  if (typeof window === "undefined") return DEFAULT_FILTERS;

  try {
    const saved = JSON.parse(
      window.localStorage.getItem(SAVED_PRACTICE_SCOPE_KEY) ?? "null"
    ) as Partial<WorkspaceFilters> | null;

    if (!saved?.gradeId || !saved.subjectId) return DEFAULT_FILTERS;

    return {
      search: "",
      gradeId: saved.gradeId,
      subjectId: saved.subjectId,
      chapterId: saved.chapterId ?? "",
      subChapterId: saved.subChapterId ?? "",
    };
  } catch {
    return DEFAULT_FILTERS;
  }
};

const PRACTICE_MIX_TYPES = [
  "mcq",
  "true_false",
  "fill_blank",
  "short_answer",
  "matching",
] as const;

type PracticeMixType = (typeof PRACTICE_MIX_TYPES)[number];

const EMPTY_MIX = PRACTICE_MIX_TYPES.reduce<Record<PracticeMixType, string>>(
  (next, type) => {
    next[type] = "0";
    return next;
  },
  {} as Record<PracticeMixType, string>
);

export function usePracticeBuilderPageData() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<WorkspaceFilters>(getInitialFilters);
  const [mixCounts, setMixCounts] =
    useState<Record<PracticeMixType, string>>(EMPTY_MIX);
  const [countValue, setCountValue] = useState("10");

  const metaQuery = useQuery({
    queryKey: ["workspace-meta"],
    queryFn: () => workspaceApi.getMeta(),
  });
  const countsQuery = useQuery({
    queryKey: ["workspace-catalog-counts", filters, "practice"],
    queryFn: () =>
      workspaceApi.getCatalogCounts({
        ...filters,
        excludeQuestionType: ["long_answer"],
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

  const configuredMixCount = useMemo(
    () =>
      PRACTICE_MIX_TYPES.reduce(
        (sum, type) => sum + (Number.parseInt(mixCounts[type] || "0", 10) || 0),
        0
      ),
    [mixCounts]
  );

  const activeMixTypes = useMemo(
    () =>
      PRACTICE_MIX_TYPES.filter(
        type => (Number.parseInt(mixCounts[type] || "0", 10) || 0) > 0
      ).length,
    [mixCounts]
  );

  const createSessionMutation = useMutation({
    mutationFn: () => {
      if (!filters.gradeId || !filters.subjectId) {
        throw new Error(
          "Choose both a grade and subject before starting practice."
        );
      }
      const questionMix = PRACTICE_MIX_TYPES.map(type => ({
        questionType: type,
        count: Number.parseInt(mixCounts[type] || "0", 10) || 0,
      })).filter(entry => entry.count > 0);

      return workspaceApi.createPracticeSession({
        ...filters,
        title: buildPracticeTitle(meta, filters.gradeId, filters.subjectId),
        count:
          questionMix.length > 0
            ? undefined
            : Math.max(1, Number.parseInt(countValue || "10", 10) || 10),
        questionMix: questionMix.length > 0 ? questionMix : undefined,
      });
    },
    onSuccess: async response => {
      if (!response.ok) return;
      await navigate({
        to: "/practice/$sessionId",
        params: { sessionId: response.data.id },
      });
    },
  });

  const meta = metaQuery.data?.ok ? metaQuery.data.data : undefined;
  const counts = countsQuery.data?.ok ? countsQuery.data.data : undefined;
  const sessions = sessionsQuery.data?.ok ? sessionsQuery.data.data.rows : [];
  const summary = summaryQuery.data?.ok ? summaryQuery.data.data : undefined;
  const planCode = summary?.subscription.code;
  const questionLimit =
    summary?.subscription.limits.maxQuestionsPerPractice ?? null;
  const activeSessionsCount = sessions.filter(
    session => session.status === "active"
  ).length;
  const scopeReady = Boolean(filters.gradeId && filters.subjectId);

  const exceedsAvailableMix = useMemo(() => {
    if (!counts) return false;
    return PRACTICE_MIX_TYPES.some(type => {
      const requested = Number.parseInt(mixCounts[type] || "0", 10) || 0;
      return requested > (counts[type] ?? 0);
    });
  }, [counts, mixCounts]);

  const totalRequested =
    configuredMixCount > 0
      ? configuredMixCount
      : Math.max(1, Number.parseInt(countValue || "10", 10) || 10);
  const exceedsAvailableQuestions = counts
    ? counts.all < totalRequested
    : false;
  const exceedsLimit =
    typeof questionLimit === "number" ? totalRequested > questionLimit : false;

  const updateFilters = (next: WorkspaceFilters) => {
    setFilters(next);
    if (!next.gradeId || !next.subjectId || typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(
        SAVED_PRACTICE_SCOPE_KEY,
        JSON.stringify({
          gradeId: next.gradeId,
          subjectId: next.subjectId,
          chapterId: next.chapterId,
          subChapterId: next.subChapterId,
        })
      );
    } catch {
      // A blocked browser storage setting should never interrupt practice.
    }
  };

  const setMixCount = (type: PracticeMixType, value: string) => {
    setMixCounts(current => ({
      ...current,
      [type]: value,
    }));
  };

  const clearMix = () => setMixCounts(EMPTY_MIX);

  const startPractice = async () => {
    await createSessionMutation.mutateAsync();
  };

  return {
    filters,
    metaQuery,
    countsQuery,
    sessionsQuery,
    summaryQuery,
    createSessionMutation,
    meta,
    counts,
    sessions,
    summary,
    planCode,
    questionLimit,
    mixCounts,
    configuredMixCount,
    activeMixTypes,
    activeSessionsCount,
    scopeReady,
    exceedsLimit,
    exceedsAvailableQuestions,
    exceedsAvailableMix,
    countValue,
    updateFilters,
    setMixCount,
    clearMix,
    setCountValue,
    startPractice,
  };
}

function buildPracticeTitle(
  meta: WorkspaceMeta | undefined,
  gradeId: string,
  subjectId: string
) {
  const gradeName = meta?.grades.find(grade => grade.id === gradeId)?.name;
  const subjectName = meta?.subjects.find(
    subject => subject.id === subjectId
  )?.name;
  return [gradeName, subjectName, "Practice"].filter(Boolean).join(" · ");
}
