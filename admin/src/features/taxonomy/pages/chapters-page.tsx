import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, BookOpenText, Sparkles, TreePine } from "lucide-react";
import { PaginationControls } from "@/components/data-table/pagination-controls";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PagePanel } from "@/components/page-container";
import { toast } from "@/components/ui/sonner";
import { taxonomyApi } from "@/features/taxonomy/api/taxonomy.api";
import { ChapterFormPanel } from "@/features/taxonomy/components/chapter-form-panel";
import { ChapterRecordsTable } from "@/features/taxonomy/components/chapter-records-table";
import { useTaxonomyMetaQuery } from "@/features/taxonomy/hooks/use-taxonomy-overview";
import type { ChapterInput, ChapterRecord } from "@/features/taxonomy/types";

export type ChapterListSearch = {
  page?: number;
  pageSize?: number;
};

const initialForm: ChapterInput = {
  gradeId: "",
  subjectId: "",
  code: "",
  name: "",
  description: "",
  sortOrder: 0,
  isActive: true,
};

export const CHAPTER_DEFAULT_PAGE = 1;
export const CHAPTER_DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

type ChaptersPageProps = {
  search: ChapterListSearch;
};

export function ChaptersPage({ search }: ChaptersPageProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const metaQuery = useTaxonomyMetaQuery();
  const [editingChapter, setEditingChapter] = useState<ChapterRecord | null>(null);
  const [form, setForm] = useState<ChapterInput>(initialForm);
  const page = search.page ?? CHAPTER_DEFAULT_PAGE;
  const pageSize = search.pageSize ?? CHAPTER_DEFAULT_PAGE_SIZE;

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["taxonomy"] });
    await queryClient.invalidateQueries({ queryKey: ["question-meta"] });
  };

  const chaptersQuery = useQuery({
    queryKey: ["taxonomy", "chapters", page, pageSize],
    queryFn: async () => {
      const response = await taxonomyApi.getChapters({ page, pageSize });
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
    placeholderData: (previousData) => previousData,
  });

  const availableSubjects = useMemo(() => {
    if (!metaQuery.data || !form.gradeId) return [];
    return metaQuery.data.subjects.filter((subject) =>
      subject.gradeIds.includes(form.gradeId),
    );
  }, [metaQuery.data, form.gradeId]);

  const saveMutation = useMutation({
    mutationFn: async (input: ChapterInput) => {
      const response = editingChapter
        ? await taxonomyApi.updateChapter(editingChapter.id, input)
        : await taxonomyApi.createChapter(input);
      if (!response.ok) {
        throw new Error(response.message);
      }
    },
    onSuccess: async () => {
      toast.success(editingChapter ? "Chapter updated" : "Chapter created");
      setEditingChapter(null);
      setForm(initialForm);
      await refresh();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to save chapter");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await taxonomyApi.deleteChapter(id);
      if (!response.ok) {
        throw new Error(response.message);
      }
    },
    onSuccess: async () => {
      toast.success("Chapter deleted");
      await refresh();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete chapter");
    },
  });

  if ((metaQuery.isLoading && !metaQuery.data) || (chaptersQuery.isLoading && !chaptersQuery.data)) {
    return <PagePanel className="bg-white/88">Loading chapters...</PagePanel>;
  }

  if (
    metaQuery.error instanceof Error ||
    chaptersQuery.error instanceof Error ||
    !metaQuery.data ||
    !chaptersQuery.data
  ) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Could not load chapters</AlertTitle>
        <AlertDescription>
          {metaQuery.error instanceof Error
            ? metaQuery.error.message
            : chaptersQuery.error instanceof Error
              ? chaptersQuery.error.message
              : "Missing chapter data."}
        </AlertDescription>
      </Alert>
    );
  }

  const chapterPage = chaptersQuery.data;
  const from =
    chapterPage.total === 0 ? 0 : (chapterPage.page - 1) * chapterPage.pageSize + 1;
  const to =
    chapterPage.total === 0
      ? 0
      : Math.min(
          (chapterPage.page - 1) * chapterPage.pageSize + chapterPage.rows.length,
          chapterPage.total,
        );
  const activeCount = chapterPage.rows.filter((chapter) => chapter.isActive).length;

  return (
    <div className="space-y-4">
      <PagePanel className="space-y-4 bg-gradient-to-br from-white/95 via-indigo-50/45 to-slate-100/70">
        <div className="space-y-3 lg:flex lg:items-start lg:justify-between lg:space-y-0">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              Taxonomy • Chapter Layer
            </p>
            <h2 className="text-2xl font-black text-slate-900 sm:text-3xl">
              Connect chapter structure to each subject
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-slate-600">
              Chapters belong to both a grade and a subject, matching the database model.
              Keep chapter naming concise so selectors stay readable in question forms.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:w-auto">
            <div className="rounded-2xl border border-slate-200 bg-white/90 px-3 py-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                Total
              </p>
              <p className="mt-1 text-lg font-black text-slate-900">{chapterPage.total}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-3 py-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                Active
              </p>
              <p className="mt-1 text-lg font-black text-emerald-900">{activeCount}</p>
            </div>
          </div>
        </div>
      </PagePanel>

      <ChapterFormPanel
        editingChapter={editingChapter}
        form={form}
        meta={metaQuery.data}
        availableSubjects={availableSubjects}
        isSaving={saveMutation.isPending}
        onFormChange={setForm}
        onSubmit={(event) => {
          event.preventDefault();
          void saveMutation.mutateAsync(form);
        }}
        onCancel={() => {
          setEditingChapter(null);
          setForm(initialForm);
        }}
      />

      <PagePanel className="space-y-4 bg-white/92">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-black text-slate-900">
              <BookOpenText className="h-4 w-4 text-slate-500" />
              Chapter records
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Showing {from}-{to} of {chapterPage.total}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
            <TreePine className="h-3.5 w-3.5" />
            Mid-level taxonomy branches
            <Sparkles className="h-3.5 w-3.5" />
          </div>
        </div>
        <ChapterRecordsTable
          chapters={chapterPage.rows}
          onEdit={(chapter) => {
            setEditingChapter(chapter);
            setForm({
              gradeId: chapter.gradeId,
              subjectId: chapter.subjectId,
              code: chapter.code ?? "",
              name: chapter.name,
              description: chapter.description ?? "",
              sortOrder: chapter.sortOrder,
              isActive: chapter.isActive,
            });
          }}
          onDelete={(chapter) => {
            if (!window.confirm(`Delete chapter "${chapter.name}"?`)) return;
            void deleteMutation.mutateAsync(chapter.id);
          }}
        />

        <PaginationControls
          page={chapterPage.page}
          totalPages={chapterPage.totalPages}
          totalRows={chapterPage.total}
          from={from}
          to={to}
          pageSize={chapterPage.pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          onPageSizeChange={(nextSize) => {
            void navigate({
              to: "/taxonomy/chapters",
              search: { page: CHAPTER_DEFAULT_PAGE, pageSize: nextSize },
              replace: true,
            });
          }}
          onPrev={() => {
            void navigate({
              to: "/taxonomy/chapters",
              search: {
                page: Math.max(CHAPTER_DEFAULT_PAGE, chapterPage.page - 1),
                pageSize: chapterPage.pageSize,
              },
              replace: true,
            });
          }}
          onNext={() => {
            void navigate({
              to: "/taxonomy/chapters",
              search: {
                page: Math.min(chapterPage.totalPages, chapterPage.page + 1),
                pageSize: chapterPage.pageSize,
              },
              replace: true,
            });
          }}
        />
      </PagePanel>
    </div>
  );
}
