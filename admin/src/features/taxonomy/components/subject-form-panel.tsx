import type { Dispatch, FormEvent, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PagePanel } from "@/components/page-container";
import { Textarea } from "@/components/ui/textarea";
import type { SubjectInput, SubjectRecord, TaxonomyMeta } from "../types";

type SubjectFormPanelProps = {
  editingSubject: SubjectRecord | null;
  form: SubjectInput;
  grades: TaxonomyMeta["grades"];
  isSaving: boolean;
  onFormChange: Dispatch<SetStateAction<SubjectInput>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
};

export function SubjectFormPanel({
  editingSubject,
  form,
  grades,
  isSaving,
  onFormChange,
  onSubmit,
  onCancel,
}: SubjectFormPanelProps) {
  return (
    <PagePanel className="space-y-4 bg-white/90">
      <div className="space-y-1">
        <h3 className="text-xl font-black text-slate-900">
          {editingSubject ? "Edit subject" : "Create subject"}
        </h3>
        <p className="text-sm text-slate-600">
          Link each subject to the correct grades to keep chapter/sub-chapter filtering accurate.
        </p>
      </div>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="subject-code">Code</Label>
            <Input
              id="subject-code"
              value={form.code}
              onChange={(event) =>
                onFormChange((current) => ({ ...current, code: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject-name">Name</Label>
            <Input
              id="subject-name"
              value={form.name}
              onChange={(event) =>
                onFormChange((current) => ({ ...current, name: event.target.value }))
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
              onFormChange((current) => ({ ...current, description: event.target.value }))
            }
          />
        </div>
        <div className="space-y-3">
          <Label>Available grades</Label>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {grades.map((grade) => (
              <label
                key={grade.id}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
              >
                <Checkbox
                  checked={form.gradeIds.includes(grade.id)}
                  onCheckedChange={(checked) =>
                    onFormChange((current) => ({
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
              onFormChange((current) => ({ ...current, isActive: checked === true }))
            }
          />
          Active
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="submit" disabled={isSaving}>
            {editingSubject ? "Update subject" : "Create subject"}
          </Button>
          {editingSubject ? (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>
    </PagePanel>
  );
}
