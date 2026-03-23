import type {
  QuestionChapter,
  QuestionMeta,
  QuestionSubChapter,
  QuestionTaxonomyOption,
} from "../types/question.type";

export const getSubjectsForGrade = (
  meta: QuestionMeta | undefined,
  gradeId: string,
): QuestionTaxonomyOption[] => {
  if (!meta || !gradeId) return [];

  const subjectIds = new Set(
    meta.gradeSubjects
      .filter((item) => item.gradeId === gradeId)
      .map((item) => item.subjectId),
  );

  return meta.subjects.filter((subject) => subjectIds.has(subject.id));
};

export const getChaptersForSelection = (
  meta: QuestionMeta | undefined,
  gradeId: string,
  subjectId: string,
): QuestionChapter[] => {
  if (!meta || !gradeId || !subjectId) return [];

  return meta.chapters.filter(
    (chapter) =>
      chapter.gradeId === gradeId && chapter.subjectId === subjectId,
  );
};

export const getSubChaptersForChapter = (
  meta: QuestionMeta | undefined,
  chapterId: string,
): QuestionSubChapter[] => {
  if (!meta || !chapterId) return [];
  return meta.subChapters.filter((subChapter) => subChapter.chapterId === chapterId);
};
