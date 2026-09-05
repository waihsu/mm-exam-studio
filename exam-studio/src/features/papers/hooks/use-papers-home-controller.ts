import { useMemo, useState } from "react";
import { useRefreshAction } from "@/hooks/use-refresh-action";
import { useQuickTypeCountsQuery } from "@/features/practice/hooks/use-quick-type-counts-query";
import {
  useWorkspaceScopeFilters,
  type ScopeFilterValue,
  type ScopePickerKey,
} from "@/features/workspace/hooks/use-workspace-scope-filters";
import { useWorkspaceMetaQuery } from "@/features/workspace/hooks/use-workspace-meta-query";
import type { QuestionPaperSummary } from "../types/papers.types";
import { useCreateQuestionPaperMutation } from "./use-create-question-paper-mutation";
import { useExportedQuestionPapersQuery } from "./use-exported-question-papers-query";
import { useQuestionPapersQuery } from "./use-question-papers-query";
import { EMPTY_PAPER_MIX_COUNTS, PAPER_MIX_TYPES } from "../components/papers-home.config";
import type { PaperQuestionType } from "../types/papers.types";

type ScopeLabels = {
  grade: string;
  subject: string;
  chapter: string;
  lesson: string;
  allGrades: string;
  allSubjects: string;
  allChapters: string;
  allLessons: string;
};

export const usePapersHomeController = ({
  scopeLabels,
  createFailedMessage,
  gradeRequiredMessage,
  onPaperCreated,
}: {
  scopeLabels: ScopeLabels;
  createFailedMessage: string;
  gradeRequiredMessage: string;
  onPaperCreated: (paperId: string) => void;
}) => {
  const papersQuery = useQuestionPapersQuery();
  const exportedPapersQuery = useExportedQuestionPapersQuery();
  const workspaceMetaQuery = useWorkspaceMetaQuery();
  const createMutation = useCreateQuestionPaperMutation();

  const [title, setTitle] = useState("");
  const [count, setCount] = useState("10");
  const [gradeId, setGradeId] = useState<ScopeFilterValue>("all");
  const [subjectId, setSubjectId] = useState<ScopeFilterValue>("all");
  const [chapterId, setChapterId] = useState<ScopeFilterValue>("all");
  const [subChapterId, setSubChapterId] = useState<ScopeFilterValue>("all");
  const [includeAnswerKey, setIncludeAnswerKey] = useState(false);
  const [mixCounts, setMixCounts] = useState<Record<PaperQuestionType, string>>(
    EMPTY_PAPER_MIX_COUNTS,
  );
  const [papersSearch, setPapersSearch] = useState("");
  const [papersStatusFilter, setPapersStatusFilter] = useState<
    "all" | "draft" | "finalized" | "exported"
  >("all");
  const [exportsSearch, setExportsSearch] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [helpSheetOpen, setHelpSheetOpen] = useState(false);
  const [activeScopePicker, setActiveScopePicker] = useState<ScopePickerKey | null>(null);

  const {
    gradeOptions,
    subjectOptions,
    chapterOptions,
    subChapterOptions,
    scopeSummary,
    activeScopePickerLabel,
    activeScopePickerOptions,
    activeScopePickerValue,
  } = useWorkspaceScopeFilters({
    meta: workspaceMetaQuery.data,
    gradeId,
    subjectId,
    chapterId,
    subChapterId,
    activeScopePicker,
    labels: scopeLabels,
  });

  const countValue = Math.max(1, Math.min(50, Number.parseInt(count, 10) || 10));
  const configuredMixCount = useMemo(
    () =>
      PAPER_MIX_TYPES.reduce(
        (sum, type) => sum + (Number.parseInt(mixCounts[type] || "0", 10) || 0),
        0,
      ),
    [mixCounts],
  );

  const quickTypeCountsQuery = useQuickTypeCountsQuery(
    {
      gradeId: gradeId === "all" ? undefined : gradeId,
      subjectId: subjectId === "all" ? undefined : subjectId,
      chapterId: chapterId === "all" ? undefined : chapterId,
      subChapterId: subChapterId === "all" ? undefined : subChapterId,
    },
    ["all", "mcq", "true_false"],
  );

  const papersRefresh = useRefreshAction(async () => {
    await Promise.allSettled([
      papersQuery.refetch(),
      exportedPapersQuery.refetch(),
      quickTypeCountsQuery.refetch(),
    ]);
  });

  const filteredSavedPapers = useMemo(() => {
    const rows = papersQuery.data?.rows ?? [];
    const normalizedSearch = papersSearch.trim().toLowerCase();

    return rows.filter((paper) => {
      const matchesStatus =
        papersStatusFilter === "all"
          ? true
          : papersStatusFilter === "exported"
            ? Boolean(paper.exportedAt)
            : paper.status === papersStatusFilter;

      if (!matchesStatus) return false;
      if (!normalizedSearch) return true;

      const haystack = [
        paper.title,
        paper.grade?.name ?? "",
        paper.subject?.name ?? "",
        paper.academicYear ?? "",
        paper.schoolName ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [papersQuery.data?.rows, papersSearch, papersStatusFilter]);

  const filteredExportedPapers = useMemo(() => {
    const rows = exportedPapersQuery.data?.rows ?? [];
    const normalizedSearch = exportsSearch.trim().toLowerCase();

    if (!normalizedSearch) return rows;

    return rows.filter((paper) => {
      const haystack = [
        paper.title,
        paper.grade?.name ?? "",
        paper.subject?.name ?? "",
        paper.academicYear ?? "",
        paper.schoolName ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [exportedPapersQuery.data?.rows, exportsSearch]);

  const selectGrade = (value: ScopeFilterValue) => {
    setGradeId(value);
    setSubjectId("all");
    setChapterId("all");
    setSubChapterId("all");
  };

  const selectSubject = (value: ScopeFilterValue) => {
    setSubjectId(value);
    setChapterId("all");
    setSubChapterId("all");
  };

  const selectChapter = (value: ScopeFilterValue) => {
    setChapterId(value);
    setSubChapterId("all");
  };

  const selectSubChapter = (value: ScopeFilterValue) => {
    setSubChapterId(value);
  };

  const clearFilters = () => {
    setGradeId("all");
    setSubjectId("all");
    setChapterId("all");
    setSubChapterId("all");
  };

  const selectScopeValue = (value: ScopeFilterValue) => {
    if (activeScopePicker === "grade") {
      selectGrade(value);
    } else if (activeScopePicker === "subject") {
      selectSubject(value);
    } else if (activeScopePicker === "chapter") {
      selectChapter(value);
    } else if (activeScopePicker === "lesson") {
      selectSubChapter(value);
    }
    setActiveScopePicker(null);
  };

  const createQuickGeneratedPaper = async () => {
    if (createMutation.isPending) {
      return;
    }

    if (gradeId === "all") {
      setCreateError(gradeRequiredMessage);
      return;
    }

    if (!title.trim()) {
      return;
    }

    setCreateError(null);

    const questionMix = PAPER_MIX_TYPES.map((type) => ({
      questionType: type,
      count: Number.parseInt(mixCounts[type] || "0", 10) || 0,
    })).filter((entry) => entry.count > 0);

    try {
      const created = await createMutation.mutateAsync({
        title: title.trim(),
        gradeId: gradeId === "all" ? undefined : gradeId,
        subjectId: subjectId === "all" ? undefined : subjectId,
        chapterId: chapterId === "all" ? undefined : chapterId,
        subChapterId: subChapterId === "all" ? undefined : subChapterId,
        includeAnswerKey,
        count: questionMix.length > 0 ? undefined : countValue,
        questionMix: questionMix.length > 0 ? questionMix : undefined,
      });

      onPaperCreated(created.id);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : createFailedMessage);
    }
  };

  return {
    papersQuery,
    exportedPapersQuery,
    workspaceMetaQuery,
    createMutation,
    title,
    setTitle,
    count,
    setCount,
    includeAnswerKey,
    setIncludeAnswerKey,
    mixCounts,
    setMixCounts,
    papersSearch,
    setPapersSearch,
    papersStatusFilter,
    setPapersStatusFilter,
    exportsSearch,
    setExportsSearch,
    createError,
    helpSheetOpen,
    setHelpSheetOpen,
    activeScopePicker,
    setActiveScopePicker,
    gradeOptions,
    subjectOptions,
    chapterOptions,
    subChapterOptions,
    scopeSummary,
    activeScopePickerLabel,
    activeScopePickerOptions,
    activeScopePickerValue,
    configuredMixCount,
    hasSelectedGrade: gradeId !== "all",
    quickTypeCountsQuery,
    papersRefresh,
    filteredSavedPapers,
    filteredExportedPapers,
    clearFilters,
    selectScopeValue,
    createQuickGeneratedPaper,
  };
};

export const buildPaperSearchHaystack = (paper: QuestionPaperSummary) =>
  [
    paper.title,
    paper.grade?.name ?? "",
    paper.subject?.name ?? "",
    paper.academicYear ?? "",
    paper.schoolName ?? "",
  ]
    .join(" ")
    .toLowerCase();
