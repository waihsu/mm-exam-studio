import type { Dispatch, SetStateAction } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { QuestionInput } from "../../schema/question.schema";
import type { QuestionVariableDefinition } from "../../types/question.type";
import { createEmptyVariable } from "../question-form.helpers";

type QuestionVariableSchemaEditorProps = {
  form: QuestionInput;
  onFormChange: Dispatch<SetStateAction<QuestionInput>>;
};

export function QuestionVariableSchemaEditor({
  form,
  onFormChange,
}: QuestionVariableSchemaEditorProps) {
  const updateVariable = (
    index: number,
    update: (variable: QuestionVariableDefinition) => QuestionVariableDefinition,
  ) => {
    onFormChange((current) => ({
      ...current,
      variablesSchema: current.variablesSchema.map((item, itemIndex) =>
        itemIndex === index ? update(item) : item,
      ),
    }));
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/90 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900">Variables</h3>
          <p className="text-sm text-slate-600">
            Define reusable values for template placeholders.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full border-slate-300/80 bg-white sm:w-auto"
          onClick={() =>
            onFormChange((current) => ({
              ...current,
              variablesSchema: [...current.variablesSchema, createEmptyVariable()],
            }))
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Add variable
        </Button>
      </div>

      <div className="space-y-3">
        {form.variablesSchema.length ? (
          form.variablesSchema.map((variable, index) => (
            <div
              key={`${variable.key || "variable"}-${index}`}
              className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
            >
              <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_1fr_auto]">
                <div className="space-y-2">
                  <Label>Key</Label>
                  <Input
                    value={variable.key}
                    onChange={(event) =>
                      onFormChange((current) => {
                        const previousKey = current.variablesSchema[index]?.key;
                        const nextKey = event.target.value;

                        return {
                          ...current,
                          variablesSchema: current.variablesSchema.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, key: nextKey } : item,
                          ),
                          parametricValueSets: current.parametricValueSets.map((valueSet) => {
                            if (!previousKey || previousKey === nextKey) return valueSet;

                            const nextValueSet = { ...valueSet };
                            const previousValue = nextValueSet[previousKey];
                            delete nextValueSet[previousKey];
                            if (nextKey.trim() && previousValue !== undefined) {
                              nextValueSet[nextKey] = previousValue;
                            }
                            return nextValueSet;
                          }),
                        };
                      })
                    }
                    placeholder="a"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input
                    value={variable.label ?? ""}
                    onChange={(event) => updateVariable(index, (item) => ({ ...item, label: event.target.value }))}
                    placeholder="First number"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={variable.type}
                    onValueChange={(value) =>
                      onFormChange((current) => {
                        const nextType = value as QuestionVariableDefinition["type"];
                        const nextVariables = current.variablesSchema.map((item, itemIndex) =>
                          itemIndex === index
                            ? {
                                ...item,
                                type: nextType,
                                min: nextType === "number" ? item.min ?? 1 : undefined,
                                max: nextType === "number" ? item.max ?? 10 : undefined,
                                step: nextType === "number" ? item.step ?? 1 : undefined,
                                choices: nextType === "text" ? item.choices ?? [""] : [],
                              }
                            : item,
                        );
                        const nextVariable = nextVariables[index];

                        return {
                          ...current,
                          variablesSchema: nextVariables,
                          parametricValueSets: nextVariable?.key.trim()
                            ? current.parametricValueSets.map((valueSet) => ({
                                ...valueSet,
                                [nextVariable.key]:
                                  nextType === "number"
                                    ? nextVariable.min ?? ""
                                    : nextVariable.choices?.[0] ?? "",
                              }))
                            : current.parametricValueSets,
                        };
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-300/80 bg-white"
                    onClick={() =>
                      onFormChange((current) => {
                        const removedKey = current.variablesSchema[index]?.key;
                        return {
                          ...current,
                          variablesSchema: current.variablesSchema.filter(
                            (_, itemIndex) => itemIndex !== index,
                          ),
                          parametricValueSets: removedKey
                            ? current.parametricValueSets.map((valueSet) => {
                                const nextValueSet = { ...valueSet };
                                delete nextValueSet[removedKey];
                                return nextValueSet;
                              })
                            : current.parametricValueSets,
                        };
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {variable.type === "number" ? (
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Min</Label>
                    <Input
                      type="number"
                      value={variable.min ?? ""}
                      onChange={(event) =>
                        updateVariable(index, (item) => ({
                          ...item,
                          min: event.target.value === "" ? undefined : Number(event.target.value),
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max</Label>
                    <Input
                      type="number"
                      value={variable.max ?? ""}
                      onChange={(event) =>
                        updateVariable(index, (item) => ({
                          ...item,
                          max: event.target.value === "" ? undefined : Number(event.target.value),
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Step</Label>
                    <Input
                      type="number"
                      min={1}
                      value={variable.step ?? ""}
                      onChange={(event) =>
                        updateVariable(index, (item) => ({
                          ...item,
                          step: event.target.value === "" ? undefined : Number(event.target.value),
                        }))
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Choices</Label>
                  <Input
                    value={(variable.choices ?? []).join(", ")}
                    onChange={(event) =>
                      updateVariable(index, (item) => ({
                        ...item,
                        choices: event.target.value.split(",").map((choice) => choice.trim()),
                      }))
                    }
                    placeholder="red, blue, green"
                  />
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
            No variables yet. Add one or choose a quick start template to begin using placeholders
            like <span className="mx-1 font-semibold text-slate-900">{"{{a}}"}</span> in your
            question text.
          </div>
        )}
      </div>
    </div>
  );
}
