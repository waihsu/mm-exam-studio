import type { Dispatch, FormEvent, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PagePanel } from "@/components/page-container";
import type { GradeInput, GradeRecord } from "../types";

type GradeFormPanelProps = {
  editingGrade: GradeRecord | null;
  form: GradeInput;
  isSaving: boolean;
  onFormChange: Dispatch<SetStateAction<GradeInput>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
};

export function GradeFormPanel({
  editingGrade,
  form,
  isSaving,
  onFormChange,
  onSubmit,
  onCancel,
}: GradeFormPanelProps) {
  return (
    <PagePanel className="space-y-4 bg-white/90">
      <div className="space-y-1">
        <p className="admin-kicker">Taxonomy record</p>
        <h3 className="text-xl font-black text-[#202321]">
          {editingGrade ? "Edit grade" : "Create grade"}
        </h3>
        <p className="text-sm text-[#6e706b]">
          Use short codes (`G-06`, `G-07`) and keep sort order continuous for cleaner filters.
        </p>
      </div>
      <form className="grid gap-4 md:grid-cols-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="grade-code">Code</Label>
          <Input
            id="grade-code"
            value={form.code}
            onChange={(event) =>
              onFormChange((current) => ({ ...current, code: event.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="grade-name">Name</Label>
          <Input
            id="grade-name"
            value={form.name}
            onChange={(event) =>
              onFormChange((current) => ({ ...current, name: event.target.value }))
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
              onFormChange((current) => ({
                ...current,
                sortOrder: Number(event.target.value || 0),
              }))
            }
          />
        </div>
        <label className="flex items-end gap-3 rounded-2xl border border-[#d8d4c9] bg-[#f8f5ee] px-4 py-3 text-sm text-[#202321]">
          <Checkbox
            checked={form.isActive}
            onCheckedChange={(checked) =>
              onFormChange((current) => ({ ...current, isActive: checked === true }))
            }
          />
          Active
        </label>
        <div className="flex flex-col gap-2 md:col-span-4 md:flex-row">
          <Button type="submit" disabled={isSaving}>
            {editingGrade ? "Update grade" : "Create grade"}
          </Button>
          {editingGrade ? (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>
    </PagePanel>
  );
}
