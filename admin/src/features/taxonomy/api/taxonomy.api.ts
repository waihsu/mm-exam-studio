import { api } from "@/lib/api-client";
import type {
  ChapterInput,
  ChapterRecord,
  GradeInput,
  GradeRecord,
  SubjectInput,
  SubjectRecord,
  SubChapterInput,
  SubChapterRecord,
  TaxonomyMeta,
  TaxonomyPage,
} from "../types";

type TaxonomyPageParams = {
  page: number;
  pageSize: number;
};

const toQueryString = ({ page, pageSize }: TaxonomyPageParams) =>
  `?page=${page}&pageSize=${pageSize}`;

export const taxonomyApi = {
  getMeta: () => api.get<TaxonomyMeta>("/taxonomy/meta"),
  getGrades: ({ page, pageSize }: TaxonomyPageParams) =>
    api.get<TaxonomyPage<GradeRecord>>(
      `/taxonomy/grades${toQueryString({ page, pageSize })}`,
    ),
  createGrade: (input: GradeInput) => api.post("/taxonomy/grades", input),
  updateGrade: (id: string, input: Partial<GradeInput>) =>
    api.put(`/taxonomy/grades/${id}`, input),
  deleteGrade: (id: string) => api.delete(`/taxonomy/grades/${id}`),
  getSubjects: ({ page, pageSize }: TaxonomyPageParams) =>
    api.get<TaxonomyPage<SubjectRecord>>(
      `/taxonomy/subjects${toQueryString({ page, pageSize })}`,
    ),
  createSubject: (input: SubjectInput) => api.post("/taxonomy/subjects", input),
  updateSubject: (id: string, input: Partial<SubjectInput>) =>
    api.put(`/taxonomy/subjects/${id}`, input),
  deleteSubject: (id: string) => api.delete(`/taxonomy/subjects/${id}`),
  getChapters: ({ page, pageSize }: TaxonomyPageParams) =>
    api.get<TaxonomyPage<ChapterRecord>>(
      `/taxonomy/chapters${toQueryString({ page, pageSize })}`,
    ),
  createChapter: (input: ChapterInput) => api.post("/taxonomy/chapters", input),
  updateChapter: (id: string, input: Partial<ChapterInput>) =>
    api.put(`/taxonomy/chapters/${id}`, input),
  deleteChapter: (id: string) => api.delete(`/taxonomy/chapters/${id}`),
  getSubChapters: ({ page, pageSize }: TaxonomyPageParams) =>
    api.get<TaxonomyPage<SubChapterRecord>>(
      `/taxonomy/sub-chapters${toQueryString({ page, pageSize })}`,
    ),
  createSubChapter: (input: SubChapterInput) =>
    api.post("/taxonomy/sub-chapters", input),
  updateSubChapter: (id: string, input: Partial<SubChapterInput>) =>
    api.put(`/taxonomy/sub-chapters/${id}`, input),
  deleteSubChapter: (id: string) => api.delete(`/taxonomy/sub-chapters/${id}`),
};
