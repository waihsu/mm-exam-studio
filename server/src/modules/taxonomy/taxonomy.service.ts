import { chapter, db, grade, gradeSubject, subChapter } from "@/db";
import { and, count, eq, inArray } from "drizzle-orm";
import type {
  CreateChapterInput,
  CreateGradeInput,
  CreateSubjectInput,
  CreateSubChapterInput,
  UpdateChapterInput,
  UpdateGradeInput,
  UpdateSubjectInput,
  UpdateSubChapterInput,
} from "./taxonomy.schema";
import { taxonomyRepo } from "./taxonomy.repo";

type PaginationInput = {
  page?: number;
  pageSize?: number;
};

const getUniqueIds = (ids: string[]) => [...new Set(ids.filter(Boolean))];

const ensureGradesExist = async (gradeIds: string[]) => {
  const uniqueGradeIds = getUniqueIds(gradeIds);

  if (!uniqueGradeIds.length) {
    return;
  }

  const [row] = await db
    .select({ count: count() })
    .from(grade)
    .where(inArray(grade.id, uniqueGradeIds));

  if ((row?.count ?? 0) !== uniqueGradeIds.length) {
    throw new Error("One or more selected grades were not found.");
  }
};

const ensureGradeSubjectLink = async (gradeId: string, subjectId: string) => {
  const [row] = await db
    .select({ isActive: gradeSubject.isActive })
    .from(gradeSubject)
    .where(
      and(
        eq(gradeSubject.gradeId, gradeId),
        eq(gradeSubject.subjectId, subjectId),
      ),
    )
    .limit(1);

  if (!row) {
    throw new Error("Selected subject is not linked to the selected grade.");
  }

  if (!row.isActive) {
    throw new Error("Selected grade and subject link is inactive.");
  }
};

const getChapterOrThrow = async (chapterId: string) => {
  const [row] = await db
    .select({
      id: chapter.id,
      gradeId: chapter.gradeId,
      subjectId: chapter.subjectId,
    })
    .from(chapter)
    .where(eq(chapter.id, chapterId))
    .limit(1);

  if (!row) {
    throw new Error("Chapter not found.");
  }

  return row;
};

export const getTaxonomyOverview = async () => {
  const [grades, subjects, chapters, subChapters] =
    await taxonomyRepo.getOverview();

  return {
    grades,
    subjects: subjects.map((subject) => ({
      ...subject,
      gradeIds: subject.gradeSubjects.map((item) => item.gradeId),
      grades: subject.gradeSubjects.map((item) => item.grade),
    })),
    chapters,
    subChapters,
  };
};

export const getTaxonomyMeta = async () => {
  const [grades, subjects, chapters] = await taxonomyRepo.getMeta();

  return {
    grades,
    subjects: subjects.map((subject) => ({
      id: subject.id,
      code: subject.code,
      name: subject.name,
      gradeIds: subject.gradeSubjects.map((item) => item.gradeId),
    })),
    chapters,
  };
};

export const getGradesPage = async (params: PaginationInput) =>
  taxonomyRepo.getGradesPage(params);

export const getSubjectsPage = async (params: PaginationInput) => {
  const result = await taxonomyRepo.getSubjectsPage(params);

  return {
    ...result,
    rows: result.rows.map((subject) => ({
      ...subject,
      gradeIds: subject.gradeSubjects.map((item) => item.gradeId),
      grades: subject.gradeSubjects.map((item) => item.grade),
    })),
  };
};

export const getChaptersPage = async (params: PaginationInput) =>
  taxonomyRepo.getChaptersPage(params);

export const getSubChaptersPage = async (params: PaginationInput) =>
  taxonomyRepo.getSubChaptersPage(params);

export const createGrade = (data: CreateGradeInput) =>
  taxonomyRepo.createGrade(data);

export const updateGrade = (id: string, data: UpdateGradeInput) =>
  taxonomyRepo.updateGrade(id, data);

export const deleteGrade = (id: string) => taxonomyRepo.deleteGrade(id);

export const createSubject = async (data: CreateSubjectInput) => {
  await ensureGradesExist(data.gradeIds);
  return taxonomyRepo.createSubject(data);
};

export const updateSubject = async (id: string, data: UpdateSubjectInput) => {
  if (Array.isArray(data.gradeIds)) {
    await ensureGradesExist(data.gradeIds);
  }

  return taxonomyRepo.updateSubject(id, data);
};

export const deleteSubject = (id: string) => taxonomyRepo.deleteSubject(id);

export const createChapter = async (data: CreateChapterInput) => {
  await ensureGradeSubjectLink(data.gradeId, data.subjectId);
  return taxonomyRepo.createChapter(data);
};

export const updateChapter = async (id: string, data: UpdateChapterInput) => {
  const [existingChapter] = await db
    .select({
      gradeId: chapter.gradeId,
      subjectId: chapter.subjectId,
    })
    .from(chapter)
    .where(eq(chapter.id, id))
    .limit(1);

  if (!existingChapter) {
    throw new Error("Chapter not found.");
  }

  await ensureGradeSubjectLink(
    data.gradeId ?? existingChapter.gradeId,
    data.subjectId ?? existingChapter.subjectId,
  );

  return taxonomyRepo.updateChapter(id, data);
};

export const deleteChapter = (id: string) => taxonomyRepo.deleteChapter(id);

export const createSubChapter = async (data: CreateSubChapterInput) => {
  await getChapterOrThrow(data.chapterId);
  return taxonomyRepo.createSubChapter(data);
};

export const updateSubChapter = async (
  id: string,
  data: UpdateSubChapterInput,
) => {
  const [existingSubChapter] = await db
    .select({
      chapterId: subChapter.chapterId,
    })
    .from(subChapter)
    .where(eq(subChapter.id, id))
    .limit(1);

  if (!existingSubChapter) {
    throw new Error("Sub chapter not found.");
  }

  if (data.chapterId) {
    await getChapterOrThrow(data.chapterId);
  } else {
    await getChapterOrThrow(existingSubChapter.chapterId);
  }

  return taxonomyRepo.updateSubChapter(id, data);
};

export const deleteSubChapter = (id: string) =>
  taxonomyRepo.deleteSubChapter(id);
