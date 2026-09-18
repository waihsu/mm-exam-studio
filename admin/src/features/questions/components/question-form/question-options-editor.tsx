import type { Dispatch, SetStateAction } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MathTextPreview } from "../math-text-preview";
import { VariableInsertRow } from "../question-form-variable-insert-row";
import { appendTemplateToken } from "../question-form.helpers";
import type { QuestionInput } from "../../schema/question.schema";
import type { QuestionVariableDefinition } from "../../types/question.type";

type QuestionOptionsEditorProps = {
  form: QuestionInput;
  matching: boolean;
  variableMode: boolean;
  variables: QuestionVariableDefinition[];
  onFormChange: Dispatch<SetStateAction<QuestionInput>>;
};

export function QuestionOptionsEditor({
  form,
  matching,
  variableMode,
  variables,
  onFormChange,
}: QuestionOptionsEditorProps) {
  return (
    <div id="question-answer" className="scroll-mt-24 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900">{matching ? "Matching pairs" : "Options"}</h3>
          <p className="text-sm text-slate-600">
            {variableMode
              ? "Option text can also use placeholders like {{a}}."
              : matching
                ? "Add left and right pairs. Learners will match both sides."
                : "Add answer choices and mark the correct one(s)."}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full border-slate-300/80 bg-white sm:w-auto"
          onClick={() =>
            onFormChange((current) => ({
              ...current,
              options: [
                ...current.options,
                {
                  label: matching
                    ? `Item ${current.options.length + 1}`
                    : String.fromCharCode(65 + current.options.length),
                  text: "",
                  isCorrect: matching,
                },
              ],
            }))
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          {matching ? "Add pair" : "Add option"}
        </Button>
      </div>

      <div className="space-y-3">
        {form.options.map((option, index) => (
          <div
            key={`${option.label ?? "option"}-${index}`}
            className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 md:grid-cols-[120px_minmax(0,1fr)_auto]"
          >
            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                value={option.label ?? ""}
                onChange={(event) =>
                  onFormChange((current) => ({
                    ...current,
                    options: current.options.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, label: event.target.value, isCorrect: matching ? true : item.isCorrect }
                        : item,
                    ),
                  }))
                }
                placeholder={matching ? `Item ${index + 1}` : `Option ${index + 1}`}
              />
            </div>
            <div className="space-y-2">
              <Label>{matching ? "Match text" : "Option text"}</Label>
              <Input
                value={option.text}
                onChange={(event) =>
                  onFormChange((current) => ({
                    ...current,
                    options: current.options.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, text: event.target.value, isCorrect: matching ? true : item.isCorrect }
                        : item,
                    ),
                  }))
                }
                placeholder={
                  variableMode
                    ? matching ? "Example: {{term}}" : "Example: {{a}} + {{b}}"
                    : matching ? "Write matching value" : "Write answer choice"
                }
              />
              {variableMode && variables.length ? (
                <VariableInsertRow
                  variables={variables}
                  label={`Insert into option ${option.label ?? index + 1}`}
                  onInsert={(key) =>
                    onFormChange((current) => ({
                      ...current,
                      options: current.options.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, text: appendTemplateToken(item.text, key) } : item,
                      ),
                    }))
                  }
                />
              ) : null}
              <MathTextPreview content={option.text} emptyLabel="Option preview will appear here." />
            </div>
            <div className="flex items-end gap-3">
              {!matching ? (
                <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                  <Checkbox
                    checked={option.isCorrect}
                    onCheckedChange={(checked) =>
                      onFormChange((current) => ({
                        ...current,
                        options: current.options.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, isCorrect: checked === true } : item,
                        ),
                      }))
                    }
                  />
                  Correct
                </label>
              ) : null}
              <Button
                type="button"
                variant="outline"
                className="border-slate-300/80 bg-white"
                onClick={() =>
                  onFormChange((current) => ({
                    ...current,
                    options: current.options.length > 2
                      ? current.options.filter((_, itemIndex) => itemIndex !== index)
                      : current.options,
                  }))
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
