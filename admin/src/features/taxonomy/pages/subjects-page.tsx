import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, BookMarked, Sparkles } from "lucide-react";
import { PaginationControls } from "@/components/data-table/pagination-controls";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PagePanel } from "@/components/page-container";
import { toast } from "@/components/ui/sonner";
import { taxonomyApi } from "@/features/taxonomy/api/taxonomy.api";
import { SubjectFormPanel } from "@/features/taxonomy/components/subject-form-panel";
import { SubjectRecordsTable } from "@/features/taxonomy/components/subject-records-table";
import { useTaxonomyMetaQuery } from "@/features/taxonomy/hooks/use-taxonomy-overview";
import type { SubjectInput, SubjectRecord } from "@/features/taxonomy/types";

export type SubjectListSearch = {
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

export const SUBJECT_DEFAULT_PAGE = 1;
export const SUBJECT_DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

type SubjectsPageProps = {
  search: SubjectListSearch;
};

export function SubjectsPage({ search }: SubjectsPageProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const metaQuery = useTaxonomyMetaQuery();
  const [editingSubject, setEditingSubject] = useState<SubjectRecord | null>(null);
  const [form, setForm] = useState<SubjectInput>(initialForm);
  const page = search.page ?? SUBJECT_DEFAULT_PAGE;
  const pageSize = search.pageSize ?? SUBJECT_DEFAULT_PAGE_SIZE;

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
      <PagePanel className="space-y-4 bg-[#fffdf8]">
        <div className="space-y-3 lg:flex lg:items-start lg:justify-between lg:space-y-0">
          <div className="space-y-2">
            <p className="admin-kicker">
              Taxonomy • Subject Layer
            </p>
            <h2 className="text-2xl font-black text-[#202321] sm:text-3xl">
              Map subjects across grades
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-[#6e706b]">
              Subjects can be linked to multiple grades through the grade-subject
              table. Keep labels concise to improve search and question tagging clarity.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:w-auto">
            <div className="rounded-2xl border border-[#d8d4c9] bg-[#f8f5ee] px-3 py-2">
              <p className="admin-kicker opacity-70">
                Total
              </p>
              <p className="mt-1 text-lg font-black text-[#202321]">{subjectPage.total}</p>
            </div>
            <div className="rounded-2xl border border-[#c9dcd3] bg-[#e7efe9] px-3 py-2">
              <p className="admin-kicker">
                Active
              </p>
              <p className="mt-1 text-lg font-black text-[#2b554d]">{activeCount}</p>
            </div>
          </div>
        </div>
      </PagePanel>

      <SubjectFormPanel
        editingSubject={editingSubject}
        form={form}
        grades={metaQuery.data.grades}
        isSaving={saveMutation.isPending}
        onFormChange={setForm}
        onSubmit={(event) => {
          event.preventDefault();
          void saveMutation.mutateAsync(form);
        }}
        onCancel={() => {
          setEditingSubject(null);
          setForm(initialForm);
        }}
      />

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
        <SubjectRecordsTable
          subjects={subjectPage.rows}
          onEdit={(subject) => {
            setEditingSubject(subject);
            setForm({
              code: subject.code,
              name: subject.name,
              description: subject.description ?? "",
              isActive: subject.isActive,
              gradeIds: subject.gradeIds,
            });
          }}
          onDelete={(subject) => {
            if (!window.confirm(`Delete subject "${subject.name}"?`)) return;
            void deleteMutation.mutateAsync(subject.id);
          }}
        />

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
              to: "/taxonomy/subjects",
              search: { page: SUBJECT_DEFAULT_PAGE, pageSize: nextSize },
              replace: true,
            });
          }}
          onPrev={() => {
            void navigate({
              to: "/taxonomy/subjects",
              search: {
                page: Math.max(SUBJECT_DEFAULT_PAGE, subjectPage.page - 1),
                pageSize: subjectPage.pageSize,
              },
              replace: true,
            });
          }}
          onNext={() => {
            void navigate({
              to: "/taxonomy/subjects",
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
