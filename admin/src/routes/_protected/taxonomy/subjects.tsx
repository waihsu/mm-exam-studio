import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, BookMarked, Pencil, Sparkles, Tags, Trash2 } from "lucide-react";
import { PaginationControls } from "@/components/data-table/pagination-controls";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PagePanel } from "@/components/page-container";
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
import type { SubjectInput, SubjectRecord } from "@/features/taxonomy/types";

type SubjectListSearch = {
  page?: number;
  pageSize?: number;
};

const initialForm: SubjectInput = {
  code: "",
  name: "",
  description: "",
  isActive: true,
  gradeIds: [],
};

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const Route = createFileRoute("/_protected/taxonomy/subjects")({
  validateSearch: (search): SubjectListSearch => ({
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
  component: SubjectsPage,
});

function SubjectsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const search = Route.useSearch();
  const metaQuery = useTaxonomyMetaQuery();
  const [editingSubject, setEditingSubject] = useState<SubjectRecord | null>(null);
  const [form, setForm] = useState<SubjectInput>(initialForm);
  const page = search.page ?? DEFAULT_PAGE;
  const pageSize = search.pageSize ?? DEFAULT_PAGE_SIZE;

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["taxonomy"] });
    await queryClient.invalidateQueries({ queryKey: ["question-meta"] });
  };

  const subjectsQuery = useQuery({
    queryKey: ["taxonomy", "subjects", page, pageSize],
    queryFn: async () => {
      const response = await taxonomyApi.getSubjects({ page, pageSize });
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
    placeholderData: (previousData) => previousData,
  });

  const saveMutation = useMutation({
    mutationFn: async (input: SubjectInput) => {
      const response = editingSubject
        ? await taxonomyApi.updateSubject(editingSubject.id, input)
        : await taxonomyApi.createSubject(input);
      if (!response.ok) {
        throw new Error(response.message);
      }
    },
    onSuccess: async () => {
      toast.success(editingSubject ? "Subject updated" : "Subject created");
      setEditingSubject(null);
      setForm(initialForm);
      await refresh();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to save subject");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await taxonomyApi.deleteSubject(id);
      if (!response.ok) {
        throw new Error(response.message);
      }
    },
    onSuccess: async () => {
      toast.success("Subject deleted");
      await refresh();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete subject");
    },
  });

  if ((metaQuery.isLoading && !metaQuery.data) || (subjectsQuery.isLoading && !subjectsQuery.data)) {
    return <PagePanel className="bg-white/88">Loading subjects...</PagePanel>;
  }

  if (
    metaQuery.error instanceof Error ||
    subjectsQuery.error instanceof Error ||
    !metaQuery.data ||
    !subjectsQuery.data
  ) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Could not load subjects</AlertTitle>
        <AlertDescription>
          {metaQuery.error instanceof Error
            ? metaQuery.error.message
            : subjectsQuery.error instanceof Error
              ? subjectsQuery.error.message
              : "Missing subject data."}
        </AlertDescription>
      </Alert>
    );
  }

  const subjectPage = subjectsQuery.data;
  const from =
    subjectPage.total === 0 ? 0 : (subjectPage.page - 1) * subjectPage.pageSize + 1;
  const to =
    subjectPage.total === 0
      ? 0
      : Math.min(
          (subjectPage.page - 1) * subjectPage.pageSize + subjectPage.rows.length,
          subjectPage.total,
        );
  const activeCount = subjectPage.rows.filter((subject) => subject.isActive).length;

  return (
    <div className="space-y-4">
      <PagePanel className="space-y-4 bg-gradient-to-br from-white/95 via-sky-50/55 to-slate-100/70">
        <div className="space-y-3 lg:flex lg:items-start lg:justify-between lg:space-y-0">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              Taxonomy • Subject Layer
            </p>
            <h2 className="text-2xl font-black text-slate-900 sm:text-3xl">
              Map subjects across grades
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-slate-600">
              Subjects can be linked to multiple grades through the grade-subject
              table. Keep labels concise to improve search and question tagging clarity.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:w-auto">
            <div className="rounded-2xl border border-slate-200 bg-white/90 px-3 py-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                Total
              </p>
              <p className="mt-1 text-lg font-black text-slate-900">{subjectPage.total}</p>
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
            {editingSubject ? "Edit subject" : "Create subject"}
          </h3>
          <p className="text-sm text-slate-600">
            Link each subject to the correct grades to keep chapter/sub-chapter filtering accurate.
          </p>
        </div>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void saveMutation.mutateAsync(form);
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="subject-code">Code</Label>
              <Input
                id="subject-code"
                value={form.code}
                onChange={(event) =>
                  setForm((current) => ({ ...current, code: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject-name">Name</Label>
              <Input
                id="subject-name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject-description">Description</Label>
            <Textarea
              id="subject-description"
              value={form.description ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-3">
            <Label>Available grades</Label>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {metaQuery.data.grades.map((grade) => (
                <label
                  key={grade.id}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                >
                  <Checkbox
                    checked={form.gradeIds.includes(grade.id)}
                    onCheckedChange={(checked) =>
                      setForm((current) => ({
                        ...current,
                        gradeIds:
                          checked === true
                            ? [...new Set([...current.gradeIds, grade.id])]
                            : current.gradeIds.filter((id) => id !== grade.id),
                      }))
                    }
                  />
                  {grade.code} · {grade.name}
                </label>
              ))}
            </div>
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
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" disabled={saveMutation.isPending}>
              {editingSubject ? "Update subject" : "Create subject"}
            </Button>
            {editingSubject ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingSubject(null);
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
              <BookMarked className="h-4 w-4 text-slate-500" />
              Subject records
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Showing {from}-{to} of {subjectPage.total}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
            <Sparkles className="h-3.5 w-3.5" />
            Cross-grade subject mapping
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Grades</TableHead>
              <TableHead>Stats</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[140px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjectPage.rows.length ? (
              subjectPage.rows.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell className="font-semibold">{subject.code}</TableCell>
                  <TableCell className="whitespace-normal">
                    <div className="space-y-1">
                      <p>{subject.name}</p>
                      {subject.description ? (
                        <p className="text-xs text-slate-500">{subject.description}</p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <div className="flex flex-wrap gap-1.5">
                      {subject.grades.map((grade) => (
                        <Badge
                          key={`${subject.id}-${grade.id}`}
                          variant="outline"
                          className="border-sky-200 bg-sky-50 text-sky-700"
                        >
                          <Tags className="mr-1 h-3 w-3" />
                          {grade.code}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {subject._count.chapters} chapter(s) • {subject._count.questions} question(s)
                  </TableCell>
                  <TableCell>
                    <Badge variant={subject.isActive ? "default" : "secondary"}>
                      {subject.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      title={`Edit ${subject.name}`}
                      onClick={() => {
                        setEditingSubject(subject);
                        setForm({
                          code: subject.code,
                          name: subject.name,
                          description: subject.description ?? "",
                          isActive: subject.isActive,
                          gradeIds: subject.gradeIds,
                        });
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      title={`Delete ${subject.name}`}
                      onClick={() => {
                        if (!window.confirm(`Delete subject "${subject.name}"?`)) return;
                        void deleteMutation.mutateAsync(subject.id);
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
                  No subjects yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          </Table>
        </div>

        <PaginationControls
          page={subjectPage.page}
          totalPages={subjectPage.totalPages}
          totalRows={subjectPage.total}
          from={from}
          to={to}
          pageSize={subjectPage.pageSize}
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
                page: Math.max(DEFAULT_PAGE, subjectPage.page - 1),
                pageSize: subjectPage.pageSize,
              },
              replace: true,
            });
          }}
          onNext={() => {
            void navigate({
              to: Route.to,
              search: {
                page: Math.min(subjectPage.totalPages, subjectPage.page + 1),
                pageSize: subjectPage.pageSize,
              },
              replace: true,
            });
          }}
        />
      </PagePanel>
    </div>
  );
}
