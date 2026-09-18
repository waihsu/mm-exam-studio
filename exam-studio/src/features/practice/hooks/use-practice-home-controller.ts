import { useEffect, useMemo, useState } from "react";
import { useAuthSessionQuery } from "@/features/auth/hooks/use-auth-session-query";
import {
  hasSeenAppOnboarding,
  markAppOnboardingSeen,
} from "@/features/onboarding/services/app-onboarding-store";
import { useRefreshAction } from "@/hooks/use-refresh-action";
import {
  useWorkspaceScopeFilters,
  type ScopeFilterValue,
  type ScopePickerKey,
} from "@/features/workspace/hooks/use-workspace-scope-filters";
import { useWorkspaceMetaQuery } from "@/features/workspace/hooks/use-workspace-meta-query";
import type { PracticeQuestionType } from "../types/practice.types";
import { useCreatePracticeSessionMutation } from "./use-create-practice-session-mutation";
import { usePracticeSessionsQuery } from "./use-practice-sessions-query";
import { useQuickTypeCountsQuery } from "./use-quick-type-counts-query";
import {
  getDefaultPracticeMix,
  getStoredPracticeMix,
  saveStoredPracticeMix,
} from "../services/practice-mix-store";
import {
  EMPTY_PRACTICE_MIX_COUNTS,
  PRACTICE_EXCLUDED_TYPES,
  PRACTICE_MIX_TYPES,
} from "../components/practice-home.config";

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

export const usePracticeHomeController = ({
  scopeLabels,
  createFailedMessage,
  gradeRequiredMessage,
  plannedTitle,
  quickTitle,
  onSessionCreated,
}: {
  scopeLabels: ScopeLabels;
  createFailedMessage: string;
  gradeRequiredMessage: string;
  plannedTitle: string;
  quickTitle: string;
  onSessionCreated: (sessionId: string) => void;
}) => {
  const authSessionQuery = useAuthSessionQuery();
  const workspaceMetaQuery = useWorkspaceMetaQuery();
  const [gradeId, setGradeId] = useState<ScopeFilterValue>("all");
  const [subjectId, setSubjectId] = useState<ScopeFilterValue>("all");
  const [chapterId, setChapterId] = useState<ScopeFilterValue>("all");
  const [subChapterId, setSubChapterId] = useState<ScopeFilterValue>("all");
  const [mixCounts, setMixCounts] = useState<
    Record<PracticeQuestionType, string>
  >(EMPTY_PRACTICE_MIX_COUNTS);
  const [mixHydrated, setMixHydrated] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [helpSheetOpen, setHelpSheetOpen] = useState(false);
  const [activeScopePicker, setActiveScopePicker] =
    useState<ScopePickerKey | null>(null);
  const [onboardingVisible, setOnboardingVisible] = useState(false);
  const createSessionMutation = useCreatePracticeSessionMutation();

  useEffect(() => {
    let cancelled = false;

    const userId = authSessionQuery.data?.user.id;
    if (!userId) {
      setOnboardingVisible(false);
      return;
    }

    const loadOnboardingState = async () => {
      const seen = await hasSeenAppOnboarding(userId);
      if (!cancelled && !seen) {
        setOnboardingVisible(true);
      }
    };

    void loadOnboardingState();

    return () => {
      cancelled = true;
    };
  }, [authSessionQuery.data?.user.id]);

  useEffect(() => {
    let cancelled = false;

    const loadStoredMix = async () => {
      const stored = await getStoredPracticeMix();
      if (!cancelled) {
        setMixCounts(stored);
        setMixHydrated(true);
      }
    };

    void loadStoredMix();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mixHydrated) return;
    void saveStoredPracticeMix(mixCounts);
  }, [mixCounts, mixHydrated]);

  const dismissOnboarding = async () => {
    const userId = authSessionQuery.data?.user.id;
    setOnboardingVisible(false);
    await markAppOnboardingSeen(userId);
  };

  const {
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

  const quickTypeCountsQuery = useQuickTypeCountsQuery(
    {
      excludeQuestionTypes: PRACTICE_EXCLUDED_TYPES,
      gradeId: gradeId === "all" ? undefined : gradeId,
      subjectId: subjectId === "all" ? undefined : subjectId,
      chapterId: chapterId === "all" ? undefined : chapterId,
      subChapterId: subChapterId === "all" ? undefined : subChapterId,
    },
    ["all", "mcq", "short_answer"]
  );

  const sessionsQuery = usePracticeSessionsQuery();
  const practiceRefresh = useRefreshAction(async () => {
    await Promise.allSettled([
      quickTypeCountsQuery.refetch(),
      sessionsQuery.refetch(),
    ]);
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

  const exceedsAvailableMix = useMemo(
    () =>
      PRACTICE_MIX_TYPES.some(type => {
        const requested = Number.parseInt(mixCounts[type] || "0", 10) || 0;
        const available = quickTypeCountsQuery.counts[type];
        return typeof available === "number" && requested > available;
      }),
    [mixCounts, quickTypeCountsQuery.counts]
  );

  const quickStartDisabled =
    createSessionMutation.isPending ||
    gradeId === "all" ||
    configuredMixCount > 50 ||
    exceedsAvailableMix ||
    (configuredMixCount > 0 && configuredMixCount < 1);

  const clearFilters = () => {
    setGradeId("all");
    setSubjectId("all");
    setChapterId("all");
    setSubChapterId("all");
  };

  const resetMixToDefault = () => {
    setMixCounts(getDefaultPracticeMix());
  };

  const applyPracticePreset = (
    values: Record<PracticeQuestionType, string>
  ) => {
    setMixCounts(values);
  };

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

  const quickStart = async () => {
    if (createSessionMutation.isPending || gradeId === "all") {
      if (gradeId === "all") {
        setActionError(gradeRequiredMessage);
      }
      return;
    }

    setActionError(null);

    const questionMix = PRACTICE_MIX_TYPES.map(type => ({
      questionType: type,
      count: Number.parseInt(mixCounts[type] || "0", 10) || 0,
    })).filter(entry => entry.count > 0);

    try {
      const result = await createSessionMutation.mutateAsync({
        title: questionMix.length > 0 ? plannedTitle : quickTitle,
        count: questionMix.length > 0 ? undefined : 10,
        questionMix: questionMix.length > 0 ? questionMix : undefined,
        gradeId: gradeId === "all" ? undefined : gradeId,
        subjectId: subjectId === "all" ? undefined : subjectId,
        chapterId: chapterId === "all" ? undefined : chapterId,
        subChapterId: subChapterId === "all" ? undefined : subChapterId,
      });
      onSessionCreated(result.id);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : createFailedMessage
      );
    }
  };

  return {
    authSessionQuery,
    workspaceMetaQuery,
    createSessionMutation,
    sessionsQuery,
    quickTypeCountsQuery,
    practiceRefresh,
    mixCounts,
    setMixCounts,
    actionError,
    helpSheetOpen,
    setHelpSheetOpen,
    activeScopePicker,
    setActiveScopePicker,
    onboardingVisible,
    configuredMixCount,
    activeMixTypes,
    exceedsAvailableMix,
    quickStartDisabled,
    hasSelectedGrade: gradeId !== "all",
    scopeSummary,
    activeScopePickerLabel,
    activeScopePickerOptions,
    activeScopePickerValue,
    clearFilters,
    resetMixToDefault,
    applyPracticePreset,
    selectScopeValue,
    quickStart,
    dismissOnboarding,
  };
};
