import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import type {
  PaperBlueprintQuestionType,
  PaperBlueprintSectionInput,
} from "../types";
import { blueprintMarkOptions, blueprintQuestionTypeOptions } from "./blueprint-builder.constants";
import { BlueprintEditorEmptyState } from "./blueprint-editor-empty-state";

type BlueprintSectionEditorProps = {
  sections: PaperBlueprintSectionInput[];
  onSectionsChange: (
    updater: (current: PaperBlueprintSectionInput[]) => PaperBlueprintSectionInput[],
  ) => void;
};

export function BlueprintSectionEditor({ sections, onSectionsChange }: BlueprintSectionEditorProps) {
  return (
    <PagePanel className="space-y-4 bg-white/92">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-slate-900">Sections</h3>
          <p className="text-sm text-slate-500">Define the paper groups first.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            onSectionsChange((current) => [
              ...current,
              {
                code: String.fromCharCode(65 + current.length),
                title: `Section ${String.fromCharCode(65 + current.length)}`,
                questionType: "mcq",
                marksPerQuestion: 1,
                questionCount: 1,
                totalMarks: 1,
                sortOrder: current.length + 1,
              },
            ])
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Add section
        </Button>
      </div>

      {sections.length === 0 ? (
        <BlueprintEditorEmptyState>No sections yet. Add one or apply a preset.</BlueprintEditorEmptyState>
      ) : (
        <div className="space-y-4">
          {sections.map((section, index) => (
            <div key={`${section.code}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">Section {index + 1}</p>
                <Button
                  type="button"
                  variant="outline"
                  className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                  onClick={() =>
                    onSectionsChange((current) => current.filter((_, itemIndex) => itemIndex !== index))
                  }
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                <div className="space-y-2">
                  <Label>Code</Label>
                  <Input
                    value={section.code}
                    onChange={(event) =>
                      onSectionsChange((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, code: event.target.value } : item,
                        ),
                      )
                    }
                  />
                </div>
                <div className="space-y-2 xl:col-span-2">
                  <Label>Title</Label>
                  <Input
                    value={section.title ?? ""}
                    onChange={(event) =>
                      onSectionsChange((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, title: event.target.value } : item,
                        ),
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={section.questionType ?? "mcq"}
                    onValueChange={(value) =>
                      onSectionsChange((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, questionType: value as PaperBlueprintQuestionType }
                            : item,
                        ),
                      )
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {blueprintQuestionTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Marks each</Label>
                  <Select
                    value={String(section.marksPerQuestion ?? 1)}
                    onValueChange={(value) =>
                      onSectionsChange((current) =>
                        current.map((item, itemIndex) => {
                          if (itemIndex !== index) return item;
                          const marks = Number(value) as 1 | 2 | 3 | 5 | 10;
                          return {
                            ...item,
                            marksPerQuestion: marks,
                            totalMarks: marks * item.questionCount,
                          };
                        }),
                      )
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {blueprintMarkOptions.map((mark) => (
                        <SelectItem key={mark} value={String(mark)}>
                          {mark}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Question count</Label>
                  <Input
                    type="number"
                    min={1}
                    value={section.questionCount}
                    onChange={(event) =>
                      onSectionsChange((current) =>
                        current.map((item, itemIndex) => {
                          if (itemIndex !== index) return item;
                          const questionCount = Math.max(1, Number(event.target.value || 1));
                          const marksPerQuestion = item.marksPerQuestion ?? 1;
                          return {
                            ...item,
                            questionCount,
                            totalMarks: marksPerQuestion * questionCount,
                          };
                        }),
                      )
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PagePanel>
  );
}
