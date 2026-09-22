import type { Dispatch, FormEvent, SetStateAction } from "react";
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
import type { SubChapterInput, SubChapterRecord, TaxonomyMeta } from "../types";

type SubChapterFormPanelProps = {
  editingItem: SubChapterRecord | null;
  form: SubChapterInput;
  chapters: TaxonomyMeta["chapters"];
  isSaving: boolean;
  onFormChange: Dispatch<SetStateAction<SubChapterInput>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
};

export function SubChapterFormPanel({
  editingItem,
  form,
  chapters,
  isSaving,
  onFormChange,
  onSubmit,
  onCancel,
}: SubChapterFormPanelProps) {
  return (
    <PagePanel className="space-y-4 bg-white/90">
      <div className="space-y-1">
        <h3 className="text-xl font-black text-slate-900">
          {editingItem ? "Edit sub chapter" : "Create sub chapter"}
        </h3>
        <p className="text-sm text-slate-600">
          Link each sub chapter to a chapter before saving to keep taxonomy tree integrity.
        </p>
      </div>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2 xl:col-span-2">
            <Label>Chapter</Label>
            <Select
              value={form.chapterId || "__empty__"}
              onValueChange={(value) =>
                onFormChange((current) => ({
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
                {chapters.map((chapter) => (
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
                onFormChange((current) => ({ ...current, code: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subchapter-name">Name</Label>
            <Input
              id="subchapter-name"
              value={form.name}
              onChange={(event) =>
                onFormChange((current) => ({ ...current, name: event.target.value }))
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
                onFormChange((current) => ({ ...current, description: event.target.value }))
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
            {editingItem ? "Update sub chapter" : "Create sub chapter"}
          </Button>
          {editingItem ? (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>
    </PagePanel>
  );
}
