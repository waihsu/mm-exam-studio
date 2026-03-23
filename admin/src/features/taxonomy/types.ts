export type TaxonomyLabel = {
  id: string;
  code: string | null;
  name: string;
};

export type TaxonomyPage<T> = {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type TaxonomyMeta = {
  grades: TaxonomyLabel[];
  subjects: Array<{
    id: string;
    code: string;
    name: string;
    gradeIds: string[];
  }>;
  chapters: Array<{
    id: string;
    code: string | null;
    name: string;
    gradeId: string;
    subjectId: string;
    grade: TaxonomyLabel;
    subject: TaxonomyLabel;
  }>;
};

export type GradeRecord = {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  _count: {
    gradeSubjects: number;
    chapters: number;
    questions: number;
  };
};

export type SubjectRecord = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  gradeIds: string[];
  grades: TaxonomyLabel[];
  _count: {
    gradeSubjects: number;
    chapters: number;
    questions: number;
  };
};

export type ChapterRecord = {
  id: string;
  gradeId: string;
  subjectId: string;
  code: string | null;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  grade: TaxonomyLabel;
  subject: TaxonomyLabel;
  _count: {
    subChapters: number;
    questions: number;
  };
};

export type SubChapterRecord = {
  id: string;
  chapterId: string;
  code: string | null;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  chapter: {
    id: string;
    code: string | null;
    name: string;
    grade: TaxonomyLabel;
    subject: TaxonomyLabel;
  };
  _count: {
    questions: number;
  };
};

export type TaxonomyOverview = {
  grades: GradeRecord[];
  subjects: SubjectRecord[];
  chapters: ChapterRecord[];
  subChapters: SubChapterRecord[];
};

export type GradeInput = {
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
};

export type SubjectInput = {
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  gradeIds: string[];
};

export type ChapterInput = {
  gradeId: string;
  subjectId: string;
  code?: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
};

export type SubChapterInput = {
  chapterId: string;
  code?: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
};
