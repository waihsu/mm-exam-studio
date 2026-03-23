import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Layers2, Pencil, Sparkles, Tag, Trash2 } from "lucide-react";
import { PaginationControls } from "@/components/data-table/pagination-controls";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PagePanel } from "@/components/page-container";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { taxonomyApi } from "@/features/taxonomy/api/taxonomy.api";
import { useTaxonomyMetaQuery } from "@/features/taxonomy/hooks/use-taxonomy-overview";
import type { SubChapterInput, SubChapterRecord } from "@/features/taxonomy/types";

type SubChapterListSearch = {
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

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const Route = createFileRoute("/_protected/taxonomy/sub-chapters")({
  validateSearch: (search): SubChapterListSearch => ({
    page:
      typeof search.page === "number"
        ? search.page
        : typeof search.page === "string"
          ? Number(search.page) || DEFAULT_PAGE
          : undefined,
    pageSize:
      typeof search.pageSize === "number"
        ? search.pageSize
        : typeof search.pageSize === "string"
          ? Number(search.pageSize) || DEFAULT_PAGE_SIZE
          : undefined,
  }),
  component: SubChaptersPage,
});

function SubChaptersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const search = Route.useSearch();
  const metaQuery = useTaxonomyMetaQuery();
  const [editingItem, setEditingItem] = useState<SubChapterRecord | null>(null);
  const [form, setForm] = useState<SubChapterInput>(initialForm);
  const page = search.page ?? DEFAULT_PAGE;
  const pageSize = search.pageSize ?? DEFAULT_PAGE_SIZE;

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

      <PagePanel className="space-y-4 bg-white/90">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-slate-900">
            {editingItem ? "Edit sub chapter" : "Create sub chapter"}
          </h3>
          <p className="text-sm text-slate-600">
            Link each sub chapter to a chapter before saving to keep taxonomy tree integrity.
          </p>
        </div>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void saveMutation.mutateAsync(form);
          }}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2 xl:col-span-2">
              <Label>Chapter</Label>
              <Select
                value={form.chapterId || "__empty__"}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    chapterId: value === "__empty__" ? "" : value,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select chapter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__empty__">Select chapter</SelectItem>
                  {metaQuery.data.chapters.map((chapter) => (
                    <SelectItem key={chapter.id} value={chapter.id}>
                      {chapter.grade.code} · {chapter.subject.code} · {chapter.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subchapter-code">Code</Label>
              <Input
                id="subchapter-code"
                value={form.code ?? ""}
                onChange={(event) =>
                  setForm((current) => ({ ...current, code: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subchapter-name">Name</Label>
              <Input
                id="subchapter-name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr_180px]">
            <div className="space-y-2">
              <Label htmlFor="subchapter-description">Description</Label>
              <Textarea
                id="subchapter-description"
                value={form.description ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subchapter-sort">Sort order</Label>
                <Input
                  id="subchapter-sort"
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      sortOrder: Number(event.target.value || 0),
                    }))
                  }
                />
              </div>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <Checkbox
                  checked={form.isActive}
                  onCheckedChange={(checked) =>
                    setForm((current) => ({
                      ...current,
                      isActive: checked === true,
                    }))
                  }
                />
                Active
              </label>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" disabled={saveMutation.isPending}>
              {editingItem ? "Update sub chapter" : "Create sub chapter"}
            </Button>
            {editingItem ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingItem(null);
                  setForm(initialForm);
                }}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      </PagePanel>

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
        <div className="overflow-x-auto">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Chapter</TableHead>
              <TableHead>Taxonomy</TableHead>
              <TableHead>Questions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[140px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subChapterPage.rows.length ? (
              subChapterPage.rows.map((subChapter) => (
                <TableRow key={subChapter.id}>
                  <TableCell className="whitespace-normal">
                    <div className="space-y-1">
                      <p className="font-semibold">
                        {subChapter.code ? `${subChapter.code} · ` : ""}
                        {subChapter.name}
                      </p>
                      {subChapter.description ? (
                        <p className="text-xs text-slate-500">{subChapter.description}</p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>{subChapter.chapter.name}</TableCell>
                  <TableCell className="text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                      <Tag className="h-3 w-3" />
                      {subChapter.chapter.grade.code} · {subChapter.chapter.subject.code}
                    </span>
                  </TableCell>
                  <TableCell>{subChapter._count.questions}</TableCell>
                  <TableCell>
                    <Badge variant={subChapter.isActive ? "default" : "secondary"}>
                      {subChapter.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      title={`Edit ${subChapter.name}`}
                      onClick={() => {
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
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      title={`Delete ${subChapter.name}`}
                      onClick={() => {
                        if (!window.confirm(`Delete sub chapter "${subChapter.name}"?`)) return;
                        void deleteMutation.mutateAsync(subChapter.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-slate-500">
                  No sub chapters yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          </Table>
        </div>

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
              to: Route.to,
              search: { page: DEFAULT_PAGE, pageSize: nextSize },
              replace: true,
            });
          }}
          onPrev={() => {
            void navigate({
              to: Route.to,
              search: {
                page: Math.max(DEFAULT_PAGE, subChapterPage.page - 1),
                pageSize: subChapterPage.pageSize,
              },
              replace: true,
            });
          }}
          onNext={() => {
            void navigate({
              to: Route.to,
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
