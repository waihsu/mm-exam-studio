import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, Layers2, Sparkles } from "lucide-react";
import { PaginationControls } from "@/components/data-table/pagination-controls";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PagePanel } from "@/components/page-container";
import { toast } from "@/components/ui/sonner";
import { taxonomyApi } from "@/features/taxonomy/api/taxonomy.api";
import { SubChapterFormPanel } from "@/features/taxonomy/components/sub-chapter-form-panel";
import { SubChapterRecordsTable } from "@/features/taxonomy/components/sub-chapter-records-table";
import { useTaxonomyMetaQuery } from "@/features/taxonomy/hooks/use-taxonomy-overview";
import type { SubChapterInput, SubChapterRecord } from "@/features/taxonomy/types";

export type SubChapterListSearch = {
  page?: number;
  pageSize?: number;
};

const initialForm: SubChapterInput = {
  chapterId: "",
  code: "",
  name: "",
  description: "",
  sortOrder: 0,
  isActive: true,
};

export const SUB_CHAPTER_DEFAULT_PAGE = 1;
export const SUB_CHAPTER_DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

type SubChaptersPageProps = {
  search: SubChapterListSearch;
};

export function SubChaptersPage({ search }: SubChaptersPageProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const metaQuery = useTaxonomyMetaQuery();
  const [editingItem, setEditingItem] = useState<SubChapterRecord | null>(null);
  const [form, setForm] = useState<SubChapterInput>(initialForm);
  const page = search.page ?? SUB_CHAPTER_DEFAULT_PAGE;
  const pageSize = search.pageSize ?? SUB_CHAPTER_DEFAULT_PAGE_SIZE;

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["taxonomy"] });
    await queryClient.invalidateQueries({ queryKey: ["question-meta"] });
  };

  const subChaptersQuery = useQuery({
    queryKey: ["taxonomy", "sub-chapters", page, pageSize],
    queryFn: async () => {
      const response = await taxonomyApi.getSubChapters({ page, pageSize });
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
    placeholderData: (previousData) => previousData,
  });

  const saveMutation = useMutation({
    mutationFn: async (input: SubChapterInput) => {
      const response = editingItem
        ? await taxonomyApi.updateSubChapter(editingItem.id, input)
        : await taxonomyApi.createSubChapter(input);
      if (!response.ok) {
        throw new Error(response.message);
      }
    },
    onSuccess: async () => {
      toast.success(editingItem ? "Sub chapter updated" : "Sub chapter created");
      setEditingItem(null);
      setForm(initialForm);
      await refresh();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to save sub chapter");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await taxonomyApi.deleteSubChapter(id);
      if (!response.ok) {
        throw new Error(response.message);
      }
    },
    onSuccess: async () => {
      toast.success("Sub chapter deleted");
      await refresh();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete sub chapter");
    },
  });

  if (
    (metaQuery.isLoading && !metaQuery.data) ||
    (subChaptersQuery.isLoading && !subChaptersQuery.data)
  ) {
    return <PagePanel className="bg-white/88">Loading sub chapters...</PagePanel>;
  }

  if (
    metaQuery.error instanceof Error ||
    subChaptersQuery.error instanceof Error ||
    !metaQuery.data ||
    !subChaptersQuery.data
  ) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Could not load sub chapters</AlertTitle>
        <AlertDescription>
          {metaQuery.error instanceof Error
            ? metaQuery.error.message
            : subChaptersQuery.error instanceof Error
              ? subChaptersQuery.error.message
              : "Missing sub chapter data."}
        </AlertDescription>
      </Alert>
    );
  }

  const subChapterPage = subChaptersQuery.data;
  const from =
    subChapterPage.total === 0
      ? 0
      : (subChapterPage.page - 1) * subChapterPage.pageSize + 1;
  const to =
    subChapterPage.total === 0
      ? 0
      : Math.min(
          (subChapterPage.page - 1) * subChapterPage.pageSize +
            subChapterPage.rows.length,
          subChapterPage.total,
        );
  const activeCount = subChapterPage.rows.filter((item) => item.isActive).length;

  return (
    <div className="space-y-4">
      <PagePanel className="space-y-4 bg-gradient-to-br from-white/95 via-cyan-50/45 to-slate-100/70">
        <div className="space-y-3 lg:flex lg:items-start lg:justify-between lg:space-y-0">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              Taxonomy • Sub Chapter Layer
            </p>
            <h2 className="text-2xl font-black text-slate-900 sm:text-3xl">
              Organize the final learning breakdown
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-slate-600">
              Sub chapters sit under chapters and power the most specific question filters.
              Keep this layer tidy to improve practice precision.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:w-auto">
            <div className="rounded-2xl border border-slate-200 bg-white/90 px-3 py-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                Total
              </p>
              <p className="mt-1 text-lg font-black text-slate-900">{subChapterPage.total}</p>
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

      <SubChapterFormPanel
        editingItem={editingItem}
        form={form}
        chapters={metaQuery.data.chapters}
        isSaving={saveMutation.isPending}
        onFormChange={setForm}
        onSubmit={(event) => {
          event.preventDefault();
          void saveMutation.mutateAsync(form);
        }}
        onCancel={() => {
          setEditingItem(null);
          setForm(initialForm);
        }}
      />

      <PagePanel className="space-y-4 bg-white/92">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-black text-slate-900">
              <Layers2 className="h-4 w-4 text-slate-500" />
              Sub chapter records
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Showing {from}-{to} of {subChapterPage.total}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
            <Sparkles className="h-3.5 w-3.5" />
            Deepest taxonomy layer
          </div>
        </div>
        <SubChapterRecordsTable
          subChapters={subChapterPage.rows}
          onEdit={(subChapter) => {
            setEditingItem(subChapter);
            setForm({
              chapterId: subChapter.chapterId,
              code: subChapter.code ?? "",
              name: subChapter.name,
              description: subChapter.description ?? "",
              sortOrder: subChapter.sortOrder,
              isActive: subChapter.isActive,
            });
          }}
          onDelete={(subChapter) => {
            if (!window.confirm(`Delete sub chapter "${subChapter.name}"?`)) return;
            void deleteMutation.mutateAsync(subChapter.id);
          }}
        />

        <PaginationControls
          page={subChapterPage.page}
          totalPages={subChapterPage.totalPages}
          totalRows={subChapterPage.total}
          from={from}
          to={to}
          pageSize={subChapterPage.pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          onPageSizeChange={(nextSize) => {
            void navigate({
              to: "/taxonomy/sub-chapters",
              search: { page: SUB_CHAPTER_DEFAULT_PAGE, pageSize: nextSize },
              replace: true,
            });
          }}
          onPrev={() => {
            void navigate({
              to: "/taxonomy/sub-chapters",
              search: {
                page: Math.max(SUB_CHAPTER_DEFAULT_PAGE, subChapterPage.page - 1),
                pageSize: subChapterPage.pageSize,
              },
              replace: true,
            });
          }}
          onNext={() => {
            void navigate({
              to: "/taxonomy/sub-chapters",
              search: {
                page: Math.min(subChapterPage.totalPages, subChapterPage.page + 1),
                pageSize: subChapterPage.pageSize,
              },
              replace: true,
            });
          }}
        />
      </PagePanel>
    </div>
  );
}
