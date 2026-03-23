import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, ListChecks, Pencil, Sparkles, Trash2 } from "lucide-react";
import { PaginationControls } from "@/components/data-table/pagination-controls";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PagePanel } from "@/components/page-container";
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
import type { GradeInput, GradeRecord } from "@/features/taxonomy/types";

type GradeListSearch = {
  page?: number;
  pageSize?: number;
};

const initialForm: GradeInput = {
  code: "",
  name: "",
  sortOrder: 0,
  isActive: true,
};

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const Route = createFileRoute("/_protected/taxonomy/grades")({
  validateSearch: (search): GradeListSearch => ({
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
  component: GradesPage,
});

function GradesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const search = Route.useSearch();
  const [editingGrade, setEditingGrade] = useState<GradeRecord | null>(null);
  const [form, setForm] = useState<GradeInput>(initialForm);
  const page = search.page ?? DEFAULT_PAGE;
  const pageSize = search.pageSize ?? DEFAULT_PAGE_SIZE;

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["taxonomy"] });
    await queryClient.invalidateQueries({ queryKey: ["question-meta"] });
  };

  const gradesQuery = useQuery({
    queryKey: ["taxonomy", "grades", page, pageSize],
    queryFn: async () => {
      const response = await taxonomyApi.getGrades({ page, pageSize });
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
    placeholderData: (previousData) => previousData,
  });

  const saveMutation = useMutation({
    mutationFn: async (input: GradeInput) => {
      const response = editingGrade
        ? await taxonomyApi.updateGrade(editingGrade.id, input)
        : await taxonomyApi.createGrade(input);
      if (!response.ok) {
        throw new Error(response.message);
      }
    },
    onSuccess: async () => {
      toast.success(editingGrade ? "Grade updated" : "Grade created");
      setEditingGrade(null);
      setForm(initialForm);
      await refresh();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to save grade");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await taxonomyApi.deleteGrade(id);
      if (!response.ok) {
        throw new Error(response.message);
      }
    },
    onSuccess: async () => {
      toast.success("Grade deleted");
      await refresh();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete grade");
    },
  });

  if (gradesQuery.isLoading && !gradesQuery.data) {
    return <PagePanel className="bg-white/88">Loading grades...</PagePanel>;
  }

  if (gradesQuery.error instanceof Error || !gradesQuery.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Could not load grades</AlertTitle>
        <AlertDescription>
          {gradesQuery.error instanceof Error
            ? gradesQuery.error.message
            : "Missing grade data."}
        </AlertDescription>
      </Alert>
    );
  }

  const gradePage = gradesQuery.data;
  const from = gradePage.total === 0 ? 0 : (gradePage.page - 1) * gradePage.pageSize + 1;
  const to =
    gradePage.total === 0
      ? 0
      : Math.min(
          (gradePage.page - 1) * gradePage.pageSize + gradePage.rows.length,
          gradePage.total,
        );
  const activeCount = gradePage.rows.filter((grade) => grade.isActive).length;

  return (
    <div className="space-y-4">
      <PagePanel className="space-y-4 bg-gradient-to-br from-white/95 via-slate-50/90 to-slate-100/70">
        <div className="space-y-3 lg:flex lg:items-start lg:justify-between lg:space-y-0">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              Taxonomy • Grade Layer
            </p>
            <h2 className="text-2xl font-black text-slate-900 sm:text-3xl">
              Keep grade structure clean and ordered
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-slate-600">
              Grades are the top-level taxonomy bucket for the question bank.
              Keep codes consistent so downstream subject/chapter mapping stays predictable.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:w-auto">
            <div className="rounded-2xl border border-slate-200 bg-white/90 px-3 py-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                Total
              </p>
              <p className="mt-1 text-lg font-black text-slate-900">{gradePage.total}</p>
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
            {editingGrade ? "Edit grade" : "Create grade"}
          </h3>
          <p className="text-sm text-slate-600">
            Use short codes (`G-06`, `G-07`) and keep sort order continuous for cleaner filters.
          </p>
        </div>
        <form
          className="grid gap-4 md:grid-cols-4"
          onSubmit={(event) => {
            event.preventDefault();
            void saveMutation.mutateAsync(form);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="grade-code">Code</Label>
            <Input
              id="grade-code"
              value={form.code}
              onChange={(event) =>
                setForm((current) => ({ ...current, code: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="grade-name">Name</Label>
            <Input
              id="grade-name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="grade-sort">Sort order</Label>
            <Input
              id="grade-sort"
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
          <label className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
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
          <div className="flex flex-col gap-2 md:col-span-4 md:flex-row">
            <Button type="submit" disabled={saveMutation.isPending}>
              {editingGrade ? "Update grade" : "Create grade"}
            </Button>
            {editingGrade ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingGrade(null);
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
              <ListChecks className="h-4 w-4 text-slate-500" />
              Grade records
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Showing {from}-{to} of {gradePage.total}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
            <Sparkles className="h-3.5 w-3.5" />
            Top-level taxonomy index
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Stats</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[140px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gradePage.rows.length ? (
              gradePage.rows.map((grade) => (
                <TableRow key={grade.id}>
                  <TableCell className="font-semibold">{grade.code}</TableCell>
                  <TableCell>{grade.name}</TableCell>
                  <TableCell>{grade.sortOrder}</TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {grade._count.gradeSubjects} subject link(s) • {grade._count.chapters} chapter(s) • {grade._count.questions} question(s)
                  </TableCell>
                  <TableCell>
                    <Badge variant={grade.isActive ? "default" : "secondary"}>
                      {grade.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      title={`Edit ${grade.name}`}
                      onClick={() => {
                        setEditingGrade(grade);
                        setForm({
                          code: grade.code,
                          name: grade.name,
                          sortOrder: grade.sortOrder,
                          isActive: grade.isActive,
                        });
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      title={`Delete ${grade.name}`}
                      onClick={() => {
                        if (!window.confirm(`Delete grade "${grade.name}"?`)) return;
                        void deleteMutation.mutateAsync(grade.id);
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
                  No grades yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          </Table>
        </div>

        <PaginationControls
          page={gradePage.page}
          totalPages={gradePage.totalPages}
          totalRows={gradePage.total}
          from={from}
          to={to}
          pageSize={gradePage.pageSize}
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
                page: Math.max(DEFAULT_PAGE, gradePage.page - 1),
                pageSize: gradePage.pageSize,
              },
              replace: true,
            });
          }}
          onNext={() => {
            void navigate({
              to: Route.to,
              search: {
                page: Math.min(gradePage.totalPages, gradePage.page + 1),
                pageSize: gradePage.pageSize,
              },
              replace: true,
            });
          }}
        />
      </PagePanel>
    </div>
  );
}
