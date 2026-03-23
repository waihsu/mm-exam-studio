import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, BookOpenText, Pencil, Sparkles, TreePine, Trash2 } from "lucide-react";
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
import type { ChapterInput, ChapterRecord } from "@/features/taxonomy/types";

type ChapterListSearch = {
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

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const Route = createFileRoute("/_protected/taxonomy/chapters")({
  validateSearch: (search): ChapterListSearch => ({
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
  component: ChaptersPage,
});

function ChaptersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const search = Route.useSearch();
  const metaQuery = useTaxonomyMetaQuery();
  const [editingChapter, setEditingChapter] = useState<ChapterRecord | null>(null);
  const [form, setForm] = useState<ChapterInput>(initialForm);
  const page = search.page ?? DEFAULT_PAGE;
  const pageSize = search.pageSize ?? DEFAULT_PAGE_SIZE;

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

      <PagePanel className="space-y-4 bg-white/90">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-slate-900">
            {editingChapter ? "Edit chapter" : "Create chapter"}
          </h3>
          <p className="text-sm text-slate-600">
            Always pick the grade first, then the subject to avoid orphan chapter mappings.
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
            <div className="space-y-2">
              <Label>Grade</Label>
              <Select
                value={form.gradeId || "__empty__"}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    gradeId: value === "__empty__" ? "" : value,
                    subjectId: "",
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__empty__">Select grade</SelectItem>
                  {metaQuery.data.grades.map((grade) => (
                    <SelectItem key={grade.id} value={grade.id}>
                      {grade.code} · {grade.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select
                value={form.subjectId || "__empty__"}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    subjectId: value === "__empty__" ? "" : value,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__empty__">Select subject</SelectItem>
                  {availableSubjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.code} · {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="chapter-code">Code</Label>
              <Input
                id="chapter-code"
                value={form.code ?? ""}
                onChange={(event) =>
                  setForm((current) => ({ ...current, code: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chapter-name">Name</Label>
              <Input
                id="chapter-name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr_180px]">
            <div className="space-y-2">
              <Label htmlFor="chapter-description">Description</Label>
              <Textarea
                id="chapter-description"
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
                <Label htmlFor="chapter-sort">Sort order</Label>
                <Input
                  id="chapter-sort"
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
              {editingChapter ? "Update chapter" : "Create chapter"}
            </Button>
            {editingChapter ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingChapter(null);
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
        <div className="overflow-x-auto">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Chapter</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Stats</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[140px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {chapterPage.rows.length ? (
              chapterPage.rows.map((chapter) => (
                <TableRow key={chapter.id}>
                  <TableCell className="whitespace-normal">
                    <div className="space-y-1">
                      <p className="font-semibold">
                        {chapter.code ? `${chapter.code} · ` : ""}
                        {chapter.name}
                      </p>
                      {chapter.description ? (
                        <p className="text-xs text-slate-500">{chapter.description}</p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>{chapter.grade.name}</TableCell>
                  <TableCell>{chapter.subject.name}</TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {chapter._count.subChapters} sub chapter(s) • {chapter._count.questions} question(s)
                  </TableCell>
                  <TableCell>
                    <Badge variant={chapter.isActive ? "default" : "secondary"}>
                      {chapter.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      title={`Edit ${chapter.name}`}
                      onClick={() => {
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
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      title={`Delete ${chapter.name}`}
                      onClick={() => {
                        if (!window.confirm(`Delete chapter "${chapter.name}"?`)) return;
                        void deleteMutation.mutateAsync(chapter.id);
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
                  No chapters yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          </Table>
        </div>

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
              to: Route.to,
              search: { page: DEFAULT_PAGE, pageSize: nextSize },
              replace: true,
            });
          }}
          onPrev={() => {
            void navigate({
              to: Route.to,
              search: {
                page: Math.max(DEFAULT_PAGE, chapterPage.page - 1),
                pageSize: chapterPage.pageSize,
              },
              replace: true,
            });
          }}
          onNext={() => {
            void navigate({
              to: Route.to,
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
