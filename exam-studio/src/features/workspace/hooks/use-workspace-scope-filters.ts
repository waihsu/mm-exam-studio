import { useMemo } from "react";
import type { WorkspaceMetaResponse } from "../types/workspace.types";

export type ScopeFilterValue = string | "all";

export type ScopeFilterOption = {
  value: ScopeFilterValue;
  label: string;
};

export type ScopePickerKey = "grade" | "subject" | "chapter" | "lesson";

type ScopeFilterLabels = {
  grade: string;
  subject: string;
  chapter: string;
  lesson: string;
  allGrades: string;
  allSubjects: string;
  allChapters: string;
  allLessons: string;
};

export const useWorkspaceScopeFilters = ({
  meta,
  gradeId,
  subjectId,
  chapterId,
  subChapterId,
  activeScopePicker,
  labels,
}: {
  meta: WorkspaceMetaResponse | undefined;
  gradeId: ScopeFilterValue;
  subjectId: ScopeFilterValue;
  chapterId: ScopeFilterValue;
  subChapterId: ScopeFilterValue;
  activeScopePicker: ScopePickerKey | null;
  labels: ScopeFilterLabels;
}) => {
  const visibleSubjects = useMemo(() => {
    if (!meta) return [];
    if (gradeId === "all") return meta.subjects;

    const allowedSubjectIds = new Set(
      meta.gradeSubjects
        .filter((entry) => entry.gradeId === gradeId)
        .map((entry) => entry.subjectId),
    );

    return meta.subjects.filter((subject) => allowedSubjectIds.has(subject.id));
  }, [gradeId, meta]);

  const visibleChapters = useMemo(() => {
    if (!meta) return [];

    return meta.chapters.filter((chapter) => {
      if (gradeId !== "all" && chapter.gradeId !== gradeId) return false;
      if (subjectId !== "all" && chapter.subjectId !== subjectId) return false;
      return true;
    });
  }, [gradeId, meta, subjectId]);

  const visibleSubChapters = useMemo(() => {
    if (!meta) return [];

    const visibleChapterIds = new Set(visibleChapters.map((chapter) => chapter.id));
    return meta.subChapters.filter((subChapter) => {
      if (chapterId !== "all") {
        return subChapter.chapterId === chapterId;
      }

      return visibleChapterIds.has(subChapter.chapterId);
    });
  }, [chapterId, meta, visibleChapters]);

  const gradeOptions = useMemo<ScopeFilterOption[]>(
    () =>
      (meta?.grades ?? []).map((grade) => ({
        value: grade.id,
        label: grade.name,
      })),
    [meta?.grades],
  );

  const subjectOptions = useMemo<ScopeFilterOption[]>(
    () =>
      visibleSubjects.map((subject) => ({
        value: subject.id,
        label: subject.name,
      })),
    [visibleSubjects],
  );

  const chapterOptions = useMemo<ScopeFilterOption[]>(
    () =>
      visibleChapters.map((chapter) => ({
        value: chapter.id,
        label: chapter.name,
      })),
    [visibleChapters],
  );

  const subChapterOptions = useMemo<ScopeFilterOption[]>(
    () =>
      visibleSubChapters.map((subChapter) => ({
        value: subChapter.id,
        label: subChapter.name,
      })),
    [visibleSubChapters],
  );

  const scopeSummary = useMemo(
    () => ({
      grade:
        gradeOptions.find((option) => option.value === gradeId)?.label ?? labels.allGrades,
      subject:
        subjectOptions.find((option) => option.value === subjectId)?.label ?? labels.allSubjects,
      chapter:
        chapterOptions.find((option) => option.value === chapterId)?.label ?? labels.allChapters,
      lesson:
        subChapterOptions.find((option) => option.value === subChapterId)?.label ??
        labels.allLessons,
    }),
    [
      chapterId,
      chapterOptions,
      gradeId,
      gradeOptions,
      labels.allChapters,
      labels.allGrades,
      labels.allLessons,
      labels.allSubjects,
      subjectId,
      subjectOptions,
      subChapterId,
      subChapterOptions,
    ],
  );

  const activeScopePickerLabel = useMemo(() => {
    if (activeScopePicker === "grade") return labels.grade;
    if (activeScopePicker === "subject") return labels.subject;
    if (activeScopePicker === "chapter") return labels.chapter;
    if (activeScopePicker === "lesson") return labels.lesson;
    return null;
  }, [activeScopePicker, labels.chapter, labels.grade, labels.lesson, labels.subject]);

  const activeScopePickerOptions = useMemo<ScopeFilterOption[]>(() => {
    if (activeScopePicker === "grade") {
      return [{ value: "all", label: labels.allGrades }, ...gradeOptions];
    }
    if (activeScopePicker === "subject") {
      return [{ value: "all", label: labels.allSubjects }, ...subjectOptions];
    }
    if (activeScopePicker === "chapter") {
      return [{ value: "all", label: labels.allChapters }, ...chapterOptions];
    }
    if (activeScopePicker === "lesson") {
      return [{ value: "all", label: labels.allLessons }, ...subChapterOptions];
    }
    return [];
  }, [
    activeScopePicker,
    chapterOptions,
    gradeOptions,
    labels.allChapters,
    labels.allGrades,
    labels.allLessons,
    labels.allSubjects,
    subChapterOptions,
    subjectOptions,
  ]);

  const activeScopePickerValue = useMemo<ScopeFilterValue>(() => {
    if (activeScopePicker === "grade") return gradeId;
    if (activeScopePicker === "subject") return subjectId;
    if (activeScopePicker === "chapter") return chapterId;
    if (activeScopePicker === "lesson") return subChapterId;
    return "all";
  }, [activeScopePicker, chapterId, gradeId, subChapterId, subjectId]);

  return {
    visibleSubjects,
    visibleChapters,
    visibleSubChapters,
    gradeOptions,
    subjectOptions,
    chapterOptions,
    subChapterOptions,
    scopeSummary,
    activeScopePickerLabel,
    activeScopePickerOptions,
    activeScopePickerValue,
  };
};
