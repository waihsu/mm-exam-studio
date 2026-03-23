import type { WorkspaceMeta, WorkspaceTaxonomyOption } from "../types";

export const getSubjectsForGrade = (
  meta: WorkspaceMeta | undefined,
  gradeId: string,
): WorkspaceTaxonomyOption[] => {
  if (!meta || !gradeId) return [];

  const subjectIds = new Set(
    meta.gradeSubjects
      .filter((item) => item.gradeId === gradeId)
      .map((item) => item.subjectId),
  );

  return meta.subjects.filter((subject) => subjectIds.has(subject.id));
};

export const getChaptersForSelection = (
  meta: WorkspaceMeta | undefined,
  gradeId: string,
  subjectId: string,
) => {
  if (!meta || !gradeId || !subjectId) return [];

  return meta.chapters.filter(
    (chapter) => chapter.gradeId === gradeId && chapter.subjectId === subjectId,
  );
};

export const getSubChaptersForChapter = (
  meta: WorkspaceMeta | undefined,
  chapterId: string,
) => {
  if (!meta || !chapterId) return [];
  return meta.subChapters.filter((subChapter) => subChapter.chapterId === chapterId);
};
