import type { Dispatch, SetStateAction } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { QuestionInput } from "../../schema/question.schema";
import type {
  QuestionParametricValueSet,
  QuestionVariantContent,
  QuestionVariableDefinition,
} from "../../types/question.type";

type QuestionVariableValueSetsProps = {
  form: QuestionInput;
  variables: QuestionVariableDefinition[];
  optionType: boolean;
  onFormChange: Dispatch<SetStateAction<QuestionInput>>;
};

export function QuestionVariableValueSets({
  form,
  variables,
  optionType,
  onFormChange,
}: QuestionVariableValueSetsProps) {
  const valueSetVariables = variables.filter((variable) => variable.key.length > 0);

  const createEmptyValueSet = (): QuestionParametricValueSet =>
    valueSetVariables.reduce<QuestionParametricValueSet>((valueSet, variable) => {
      valueSet[variable.key] =
        variable.type === "number" ? variable.min ?? "" : variable.choices?.[0] ?? "";
      return valueSet;
    }, {});

  const updateVariantContent = (
    setIndex: number,
    update: (variant: QuestionVariantContent) => QuestionVariantContent,
  ) => {
    onFormChange((current) => {
      const variantContents = Array.from(
        { length: current.parametricValueSets.length },
        (_, index) => ({ ...current.variantContents[index] }),
      );
      variantContents[setIndex] = update({ ...variantContents[setIndex] });
      return { ...current, variantContents };
    });
  };

  return (
    <div className="space-y-4 rounded-2xl border border-sky-100 bg-sky-50/50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="font-bold text-slate-900">Fixed value sets</h4>
          <p className="text-sm text-slate-600">
            Define complete, repeatable variable combinations for this question.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full border-sky-200 bg-white sm:w-auto"
          disabled={!valueSetVariables.length || form.parametricValueSets.length >= 20}
          onClick={() =>
            onFormChange((current) => ({
              ...current,
              parametricValueSets: [...current.parametricValueSets, createEmptyValueSet()],
            }))
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Add value set
        </Button>
      </div>

      {form.parametricValueSets.length ? (
        <div className="overflow-x-auto rounded-xl border border-sky-100 bg-white">
          <table className="w-full min-w-[620px] border-collapse text-sm">
            <thead className="bg-sky-50 text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-3 py-3">Variable</th>
                {form.parametricValueSets.map((_, setIndex) => (
                  <th key={`value-set-${setIndex}`} className="min-w-48 px-3 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span>Set {setIndex + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-500 hover:text-red-600"
                        aria-label={`Remove value set ${setIndex + 1}`}
                        onClick={() =>
                          onFormChange((current) => ({
                            ...current,
                            parametricValueSets: current.parametricValueSets.filter(
                              (_, currentIndex) => currentIndex !== setIndex,
                            ),
                            variantContents: current.variantContents.filter(
                              (_, currentIndex) => currentIndex !== setIndex,
                            ),
                          }))
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {valueSetVariables.map((variable) => (
                <tr key={variable.key} className="border-t border-slate-100">
                  <th className="whitespace-nowrap px-3 py-3 text-left font-medium text-slate-700">
                    {variable.label?.trim() || variable.key}
                    <span className="ml-2 font-mono text-xs text-slate-400">{variable.key}</span>
                  </th>
                  {form.parametricValueSets.map((valueSet, setIndex) => (
                    <td key={`${variable.key}-${setIndex}`} className="px-3 py-2">
                      {variable.type === "text" && variable.choices?.length ? (
                        <Select
                          value={String(valueSet[variable.key] ?? "")}
                          onValueChange={(value: string) =>
                            onFormChange((current) => ({
                              ...current,
                              parametricValueSets: current.parametricValueSets.map(
                                (currentSet, currentIndex) =>
                                  currentIndex === setIndex
                                    ? { ...currentSet, [variable.key]: value }
                                    : currentSet,
                              ),
                            }))
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choose value" />
                          </SelectTrigger>
                          <SelectContent>
                            {variable.choices.map((choice) => (
                              <SelectItem key={choice} value={choice}>
                                {choice}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          type={variable.type === "number" ? "number" : "text"}
                          min={variable.type === "number" ? variable.min : undefined}
                          max={variable.type === "number" ? variable.max : undefined}
                          step={variable.type === "number" ? variable.step ?? 1 : undefined}
                          value={valueSet[variable.key] ?? ""}
                          onChange={(event) =>
                            onFormChange((current) => ({
                              ...current,
                              parametricValueSets: current.parametricValueSets.map(
                                (currentSet, currentIndex) =>
                                  currentIndex === setIndex
                                    ? { ...currentSet, [variable.key]: event.target.value }
                                    : currentSet,
                              ),
                            }))
                          }
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-slate-600">
          Optional. Use value sets when each generated version must use a selected combination
          instead of independent random values.
        </p>
      )}
      {form.parametricValueSets.length >= 20 ? (
        <p className="text-xs font-medium text-slate-500">
          A question can contain up to 20 fixed value sets.
        </p>
      ) : null}

      {form.parametricValueSets.length ? (
        <div className="space-y-3 border-t border-sky-100 pt-4">
          <div>
            <h5 className="font-bold text-slate-900">Variant-specific content</h5>
            <p className="text-sm text-slate-600">
              Leave a field blank to use the shared base content. Fill it only when this value
              set needs its own wording, answer, explanation, or options.
            </p>
          </div>
          {form.parametricValueSets.map((_, setIndex) => {
            const variant = form.variantContents[setIndex] ?? {};
            const hasOptionOverride = Boolean(variant.options?.length);

            return (
              <div
                key={`variant-content-${setIndex}`}
                className="space-y-3 rounded-xl border border-sky-100 bg-white p-4"
              >
                <p className="text-sm font-bold text-sky-900">Set {setIndex + 1} content override</p>
                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="space-y-2 lg:col-span-2">
                    <Label htmlFor={`variant-body-${setIndex}`}>Question body</Label>
                    <Textarea
                      id={`variant-body-${setIndex}`}
                      value={variant.body ?? ""}
                      onChange={(event) =>
                        updateVariantContent(setIndex, (current) => ({
                          ...current,
                          body: event.target.value || undefined,
                        }))
                      }
                      placeholder="Uses the shared question body when empty"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`variant-answer-${setIndex}`}>Answer text</Label>
                    <Input
                      id={`variant-answer-${setIndex}`}
                      value={variant.answerText ?? ""}
                      onChange={(event) =>
                        updateVariantContent(setIndex, (current) => ({
                          ...current,
                          answerText: event.target.value || undefined,
                        }))
                      }
                      placeholder="Uses the shared answer when empty"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`variant-formula-${setIndex}`}>Answer formula</Label>
                    <Input
                      id={`variant-formula-${setIndex}`}
                      value={variant.answerFormula ?? ""}
                      onChange={(event) =>
                        updateVariantContent(setIndex, (current) => ({
                          ...current,
                          answerFormula: event.target.value || undefined,
                        }))
                      }
                      placeholder="Uses the shared formula when empty"
                    />
                  </div>
                  <div className="space-y-2 lg:col-span-2">
                    <Label htmlFor={`variant-explanation-${setIndex}`}>Explanation</Label>
                    <Textarea
                      id={`variant-explanation-${setIndex}`}
                      value={variant.explanation ?? ""}
                      onChange={(event) =>
                        updateVariantContent(setIndex, (current) => ({
                          ...current,
                          explanation: event.target.value || undefined,
                        }))
                      }
                      placeholder="Uses the shared explanation when empty"
                    />
                  </div>
                </div>

                {optionType ? (
                  <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                      <Checkbox
                        checked={hasOptionOverride}
                        onCheckedChange={(checked) =>
                          updateVariantContent(setIndex, (current) => {
                            if (checked !== true) {
                              const withoutOptions = { ...current };
                              delete withoutOptions.options;
                              return withoutOptions;
                            }
                            return {
                              ...current,
                              options: form.options.map((option) => ({ ...option })),
                            };
                          })
                        }
                      />
                      Use independent options for this set
                    </label>
                    {hasOptionOverride ? (
                      <div className="space-y-2">
                        {(variant.options ?? []).map((option, optionIndex) => (
                          <div
                            key={`variant-option-${setIndex}-${optionIndex}`}
                            className="grid gap-2 md:grid-cols-[100px_minmax(0,1fr)_auto]"
                          >
                            <Input
                              value={option.label ?? ""}
                              onChange={(event) =>
                                updateVariantContent(setIndex, (current) => ({
                                  ...current,
                                  options: (current.options ?? []).map((item, itemIndex) =>
                                    itemIndex === optionIndex
                                      ? { ...item, label: event.target.value }
                                      : item,
                                  ),
                                }))
                              }
                              placeholder="Label"
                            />
                            <Input
                              value={option.text}
                              onChange={(event) =>
                                updateVariantContent(setIndex, (current) => ({
                                  ...current,
                                  options: (current.options ?? []).map((item, itemIndex) =>
                                    itemIndex === optionIndex
                                      ? { ...item, text: event.target.value }
                                      : item,
                                  ),
                                }))
                              }
                              placeholder="Option text"
                            />
                            <label className="flex items-center gap-2 text-sm">
                              <Checkbox
                                checked={option.isCorrect}
                                onCheckedChange={(checked) =>
                                  updateVariantContent(setIndex, (current) => ({
                                    ...current,
                                    options: (current.options ?? []).map((item, itemIndex) =>
                                      itemIndex === optionIndex
                                        ? { ...item, isCorrect: checked === true }
                                        : item,
                                    ),
                                  }))
                                }
                              />
                              Correct
                            </label>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
