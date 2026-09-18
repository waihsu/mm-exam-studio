import type { Dispatch, SetStateAction } from "react";
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
import type { ChapterInput, ChapterRecord, TaxonomyMeta } from "../types";

type ChapterFormPanelProps = {
  editingChapter: ChapterRecord | null;
  form: ChapterInput;
  meta: TaxonomyMeta;
  availableSubjects: TaxonomyMeta["subjects"];
  isSaving: boolean;
  onFormChange: Dispatch<SetStateAction<ChapterInput>>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
};

export function ChapterFormPanel({
  editingChapter,
  form,
  meta,
  availableSubjects,
  isSaving,
  onFormChange,
  onSubmit,
  onCancel,
}: ChapterFormPanelProps) {
  return (
    <PagePanel className="space-y-4 bg-white/90">
      <div className="space-y-1">
        <h3 className="text-xl font-black text-slate-900">
          {editingChapter ? "Edit chapter" : "Create chapter"}
        </h3>
        <p className="text-sm text-slate-600">
          Always pick the grade first, then the subject to avoid orphan chapter mappings.
        </p>
      </div>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label>Grade</Label>
            <Select
              value={form.gradeId || "__empty__"}
              onValueChange={(value) =>
                onFormChange((current) => ({
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
                {meta.grades.map((grade) => (
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
                onFormChange((current) => ({
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
                onFormChange((current) => ({ ...current, code: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="chapter-name">Name</Label>
            <Input
              id="chapter-name"
              value={form.name}
              onChange={(event) =>
                onFormChange((current) => ({ ...current, name: event.target.value }))
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
                onFormChange((current) => ({ ...current, description: event.target.value }))
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
                  onFormChange((current) => ({
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
                  onFormChange((current) => ({ ...current, isActive: checked === true }))
                }
              />
              Active
            </label>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="submit" disabled={isSaving}>
            {editingChapter ? "Update chapter" : "Create chapter"}
          </Button>
          {editingChapter ? (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>
    </PagePanel>
  );
}
