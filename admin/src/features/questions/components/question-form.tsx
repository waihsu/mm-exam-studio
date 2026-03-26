import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Eye,
  Plus,
  Sparkles,
  Sigma,
  Trash2,
  Variable,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { MathTextPreview } from "./math-text-preview";
import { QuestionPreviewCard } from "./question-form-preview-card";
import {
  FORMULA_SNIPPETS,
  PRESET_CATEGORY_ALL,
  VARIABLE_PRESETS,
  getDefaultMarksForType,
  isAllowedMarksForType,
  QUESTION_MARK_OPTIONS,
  type VariablePreset,
  typeLabels,
} from "./question-form.constants";
import {
  appendTemplateToken,
  createEmptyMatchingOptions,
  createEmptyOptions,
  createEmptyVariable,
  createInitialFormState,
  createQuestionPreviewPayload,
  createQuestionSubmitPayload,
  createQuestionValidationPayload,
  createVariableDraft,
  ensureMatchingOptions,
  ensureMcqOptions,
  getPreviewValueDefault,
  normalizeMediaUrls,
  normalizeVariableDefinitions,
  sanitizeVariables,
  type VariableDraft,
} from "./question-form.helpers";
import { VariableInsertRow } from "./question-form-variable-insert-row";
import type {
  QuestionInput,
  QuestionPreviewRequestInput,
  QuestionSubmitInput,
} from "../schema/question.schema";
import { questionSchema } from "../schema/question.schema";
import type {
  QuestionMeta,
  QuestionPreview,
  QuestionRecord,
  QuestionType,
  QuestionVariableDefinition,
} from "../types/question.type";
import {
  getChaptersForSelection,
  getSubChaptersForChapter,
  getSubjectsForGrade,
} from "../utils/question-taxonomy";

type QuestionFormProps = {
  meta: QuestionMeta;
  initialValue?: QuestionRecord | null;
  isSubmitting?: boolean;
  isPreviewing?: boolean;
  previewResults?: QuestionPreview[];
  submitLabel?: string;
  onSubmit: (input: QuestionSubmitInput) => Promise<void>;
  onPreview?: (input: QuestionPreviewRequestInput) => Promise<void>;
};

export function QuestionForm({
  meta,
  initialValue = null,
  isSubmitting = false,
  isPreviewing = false,
  previewResults = [],
  submitLabel = "Save question",
  onSubmit,
  onPreview,
}: QuestionFormProps) {
  const [form, setForm] = useState<QuestionInput>(() =>
    createInitialFormState(initialValue),
  );
  const [previewValues, setPreviewValues] = useState<Record<string, string>>({});
  const [variableDraft, setVariableDraft] = useState<VariableDraft>(() =>
    createVariableDraft(initialValue),
  );
  const [presetCategory, setPresetCategory] = useState<string>(PRESET_CATEGORY_ALL);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const markOptions = useMemo(
    () => QUESTION_MARK_OPTIONS[form.type],
    [form.type],
  );
  useEffect(() => {
    setForm(createInitialFormState(initialValue));
    setVariableDraft(createVariableDraft(initialValue));
  }, [initialValue]);

  const subjects = useMemo(
    () => getSubjectsForGrade(meta, form.gradeId),
    [meta, form.gradeId],
  );
  const chapters = useMemo(
    () => getChaptersForSelection(meta, form.gradeId, form.subjectId),
    [meta, form.gradeId, form.subjectId],
  );
  const subChapters = useMemo(
    () => getSubChaptersForChapter(meta, form.chapterId ?? ""),
    [meta, form.chapterId],
  );
  const previewVariables = useMemo(
    () => sanitizeVariables(form.variablesSchema),
    [form.variablesSchema],
  );
  const presetCategories = useMemo(
    () => [
      PRESET_CATEGORY_ALL,
      ...Array.from(new Set(VARIABLE_PRESETS.map((preset) => preset.category))),
    ],
    [],
  );
  const visiblePresets = useMemo(
    () =>
      presetCategory === PRESET_CATEGORY_ALL
        ? VARIABLE_PRESETS
        : VARIABLE_PRESETS.filter((preset) => preset.category === presetCategory),
    [presetCategory],
  );

  useEffect(() => {
    setPreviewValues((current) =>
      previewVariables.reduce<Record<string, string>>((nextPreviewValues, variable) => {
        nextPreviewValues[variable.key] =
          current[variable.key] ?? getPreviewValueDefault(variable);
        return nextPreviewValues;
      }, {}),
    );
  }, [initialValue, previewVariables]);

  useEffect(() => {
    if (!subjects.some((subject) => subject.id === form.subjectId)) {
      setForm((current) => ({
        ...current,
        subjectId: "",
        chapterId: "",
        subChapterId: "",
      }));
    }
  }, [subjects, form.subjectId]);

  useEffect(() => {
    if (!chapters.some((chapter) => chapter.id === form.chapterId)) {
      setForm((current) => ({
        ...current,
        chapterId: "",
        subChapterId: "",
      }));
    }
  }, [chapters, form.chapterId]);

  useEffect(() => {
    if (!subChapters.some((subChapter) => subChapter.id === form.subChapterId)) {
      setForm((current) => ({
        ...current,
        subChapterId: "",
      }));
    }
  }, [subChapters, form.subChapterId]);

  const validateCurrentForm = () => {
    const validationPayload = createQuestionValidationPayload(form);
    const parsed = questionSchema.safeParse(validationPayload);
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? "Invalid form data.");
      return null;
    }

    setErrorMessage(null);
    return createQuestionSubmitPayload(form);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = validateCurrentForm();
    if (!payload) return;
    await onSubmit(payload);
  };

  const handlePreview = async () => {
    if (!onPreview) return;
    const payload = validateCurrentForm();
    if (!payload) return;
    await onPreview(createQuestionPreviewPayload(form, previewValues));
  };

  const isMcq = form.type === "mcq";
  const isMatching = form.type === "matching";
  const isOptionType = isMcq || isMatching;
  const isTextAnswerType = !isOptionType;
  const isVariableMode = form.mode === "variable";
  const numericVariableKeys = previewVariables.filter(
    (variable) => variable.type === "number",
  );

  const applyVariablePreset = (preset: VariablePreset) => {
    setForm((current) => ({
      ...current,
      mode: "variable",
      type: preset.type,
      body: preset.body,
      explanation: preset.explanation ?? "",
      answerText: preset.answerText ?? "",
      answerFormula: preset.answerFormula ?? "",
      marks: getDefaultMarksForType(preset.type),
      variablesSchema: normalizeVariableDefinitions(preset.variablesSchema),
      options:
        preset.type === "mcq"
          ? ensureMcqOptions(preset.options ?? createEmptyOptions())
          : createEmptyOptions(),
    }));
  };

  const parseMediaUrls = (value: string) =>
    normalizeMediaUrls(value.split(/\r?\n/g));

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {errorMessage ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Form needs attention</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            Core setup
          </p>
          <p className="text-sm text-slate-600">
            Define code, delivery mode, and difficulty before writing the content.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="space-y-2">
            <Label htmlFor="question-code">Question code</Label>
            <Input
              id="question-code"
              value={form.questionCode}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  questionCode: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Mode</Label>
            <Select
              value={form.mode}
              onValueChange={(value) => {
                const nextMode = value as QuestionInput["mode"];

                if (nextMode === form.mode) {
                  return;
                }

                setForm((current) => {
                  if (nextMode === "static") {
                    setVariableDraft({
                      variablesSchema: normalizeVariableDefinitions(
                        current.variablesSchema,
                      ),
                      answerFormula: current.answerFormula ?? "",
                      previewValues,
                    });

                    return {
                      ...current,
                      mode: "static",
                      variablesSchema: [],
                      answerFormula: "",
                    };
                  }

                  setPreviewValues(variableDraft.previewValues);

                  return {
                    ...current,
                    mode: "variable",
                    variablesSchema:
                      current.variablesSchema.length > 0
                        ? current.variablesSchema
                        : normalizeVariableDefinitions(variableDraft.variablesSchema),
                    answerFormula:
                      current.answerFormula?.trim().length
                        ? current.answerFormula
                        : variableDraft.answerFormula,
                  };
                });
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="static">Static question</SelectItem>
                <SelectItem value="variable">Variable question</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={form.type}
              onValueChange={(value) =>
                setForm((current) => {
                  const nextType = value as QuestionType;
                  if (nextType === current.type) {
                    return current;
                  }

                  return {
                    ...current,
                    type: nextType,
                    marks: isAllowedMarksForType(nextType, current.marks)
                      ? current.marks
                      : getDefaultMarksForType(nextType),
                    answerText:
                      nextType === "mcq" || nextType === "matching"
                        ? current.answerText
                        : current.answerText || "",
                    options:
                      nextType === "mcq"
                        ? ensureMcqOptions(current.options)
                        : nextType === "matching"
                          ? current.options.some(
                              (option) => option.text.trim() || option.label?.trim(),
                            )
                            ? ensureMatchingOptions(current.options)
                            : createEmptyMatchingOptions()
                          : createEmptyOptions(),
                  };
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(typeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Difficulty</Label>
            <Select
              value={form.difficulty}
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  difficulty: value as QuestionInput["difficulty"],
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="marks">Marks</Label>
            <Input
              id="marks"
              type="number"
              min={1}
              step={1}
              value={form.marks}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  marks: Number(event.target.value || 1),
                }))
              }
              onBlur={() =>
                setForm((current) => ({
                  ...current,
                  marks: isAllowedMarksForType(current.type, current.marks)
                    ? current.marks
                    : getDefaultMarksForType(current.type),
                }))
              }
            />
            <div className="flex flex-wrap gap-2">
              {markOptions.map((mark) => (
                <Button
                  key={mark}
                  type="button"
                  variant={form.marks === mark ? "default" : "outline"}
                  size="sm"
                  className="h-8 px-3 text-xs"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      marks: mark,
                    }))
                  }
                >
                  {mark} marks
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isVariableMode ? (
        <div className="space-y-4 rounded-2xl border border-sky-200 bg-sky-50/70 p-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Variable className="h-4 w-4 text-sky-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Variable mode is active
                </h3>
              </div>
              <p className="text-sm leading-6 text-slate-700">
                Use placeholders like <code>{"{{a}}"}</code> inside question body,
                explanation, answer text, or choice options. Add an answer formula when
                the final answer should be computed from numeric variables.
              </p>
            </div>
            <div className="space-y-2 rounded-2xl border border-white/80 bg-white/90 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                Supported now
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{"{{variable}}"}</Badge>
                <Badge variant="outline">Numeric ranges</Badge>
                <Badge variant="outline">Text choices</Badge>
                <Badge variant="outline">Answer formula</Badge>
              </div>
            </div>
          </div>

          <Alert className="border-sky-200 bg-white/90">
            <Sparkles className="h-4 w-4 text-sky-700" />
            <AlertTitle>Template mode saves one reusable question</AlertTitle>
            <AlertDescription className="text-slate-700">
              This creates one template question record. Preview and exam generation
              will render different values later, instead of saving many separate
              questions now.
            </AlertDescription>
          </Alert>

          <div className="space-y-3 rounded-2xl border border-white/80 bg-white/90 p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-sky-700" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Quick start templates
                </h3>
                <p className="text-sm text-slate-600">
                  Pick a preset to auto-fill the body, variables, and answer rule.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {presetCategories.map((category) => (
                <Button
                  key={category}
                  type="button"
                  variant={presetCategory === category ? "default" : "outline"}
                  size="sm"
                  className={
                    presetCategory === category
                      ? "h-8 px-3 text-xs"
                      : "h-8 border-slate-300/80 bg-white px-3 text-xs"
                  }
                  onClick={() => {
                    setPresetCategory(category);
                  }}
                >
                  {category}
                </Button>
              ))}
            </div>
            <div className="grid gap-3 xl:grid-cols-3">
              {visiblePresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-left transition hover:border-sky-300 hover:bg-sky-50/70"
                  onClick={() => {
                    applyVariablePreset(preset);
                  }}
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-700">
                    {preset.category}
                  </p>
                  <p className="text-sm font-bold text-slate-900">{preset.label}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {preset.description}
                  </p>
                  <p className="mt-3 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 font-mono text-xs text-slate-600">
                    {preset.answerFormula ?? preset.answerText ?? "Template answer"}
                  </p>
                  <p className="mt-3 text-xs font-medium text-sky-700">
                    Apply preset
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {isVariableMode && previewVariables.length ? (
        <VariableInsertRow
          variables={previewVariables}
          label="Insert into body"
          onInsert={(key) =>
            setForm((current) => ({
              ...current,
              body: appendTemplateToken(current.body, key),
            }))
          }
        />
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="body">
          Question body {isVariableMode ? "(supports placeholders)" : ""}
        </Label>
        <Textarea
          id="body"
          value={form.body}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              body: event.target.value,
            }))
          }
          placeholder={
            isVariableMode
              ? "Example: What is {{a}} + {{b}}?"
              : "Write the full question prompt here"
          }
          className="min-h-32"
        />
        <p className="text-xs leading-5 text-slate-500">
          Use <code>$...$</code> for inline math and <code>$$...$$</code> for
          block math. Example: <code>{"$x^2 + y^2$"}</code> or
          <code>{" $$\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$"}</code>
        </p>
        <p className="text-xs leading-5 text-slate-500">
          LaTeX changes how math is displayed. Computed answers still use the
          <span className="mx-1 font-medium text-slate-700">Answer formula</span>
          field below.
        </p>
        <MathTextPreview
          content={form.body}
          emptyLabel="Question body preview will appear here."
        />
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            Media URLs
          </p>
          <p className="text-sm text-slate-600">
            Add up to 4 URLs per section. Use one URL per line.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="question-image-urls">
              Question image URLs ({form.questionImageUrls.length}/4)
            </Label>
            <Textarea
              id="question-image-urls"
              value={form.questionImageUrls.join("\n")}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  questionImageUrls: parseMediaUrls(event.target.value),
                }))
              }
              placeholder="https://.../diagram-1.png"
              className="min-h-24"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="solution-image-urls">
              Solution image URLs ({form.solutionImageUrls.length}/4)
            </Label>
            <Textarea
              id="solution-image-urls"
              value={form.solutionImageUrls.join("\n")}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  solutionImageUrls: parseMediaUrls(event.target.value),
                }))
              }
              placeholder="https://.../solution-step-1.png"
              className="min-h-24"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-900">Publish status</p>
          <p className="text-sm text-slate-600">
            {form.isPublished
              ? "This question will be available in the published bank."
              : "Publishing from this form will also mark the question as approved."}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2">
            <span className="text-sm font-medium text-slate-700">
              {form.isPublished ? "Published" : "Draft"}
            </span>
            <Switch
              checked={form.isPublished}
              onCheckedChange={(checked) =>
                setForm((current) => ({
                  ...current,
                  isPublished: checked,
                }))
              }
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            Taxonomy mapping
          </p>
          <p className="text-sm text-slate-600">
            Link this question into the hierarchy used by search, filtering, and paper generation.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label>Grade</Label>
            <Select
              value={form.gradeId || "__empty__"}
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  gradeId: value === "__empty__" ? "" : value,
                  subjectId: "",
                  chapterId: "",
                  subChapterId: "",
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
                    {grade.code ? `${grade.code} · ${grade.name}` : grade.name}
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
                setForm((current) => ({
                  ...current,
                  subjectId: value === "__empty__" ? "" : value,
                  chapterId: "",
                  subChapterId: "",
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__empty__">Select subject</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.code
                      ? `${subject.code} · ${subject.name}`
                      : subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Chapter</Label>
            <Select
              value={form.chapterId || "__empty__"}
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  chapterId: value === "__empty__" ? "" : value,
                  subChapterId: "",
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Optional chapter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__empty__">No chapter</SelectItem>
                {chapters.map((chapter) => (
                  <SelectItem key={chapter.id} value={chapter.id}>
                    {chapter.code
                      ? `${chapter.code} · ${chapter.name}`
                      : chapter.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Sub chapter</Label>
            <Select
              value={form.subChapterId || "__empty__"}
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  subChapterId: value === "__empty__" ? "" : value,
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Optional sub chapter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__empty__">No sub chapter</SelectItem>
                {subChapters.map((subChapter) => (
                  <SelectItem key={subChapter.id} value={subChapter.id}>
                    {subChapter.code
                      ? `${subChapter.code} · ${subChapter.name}`
                      : subChapter.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {isVariableMode ? (
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
                setForm((current) => ({
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
                          setForm((current) => ({
                            ...current,
                            variablesSchema: current.variablesSchema.map(
                              (item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, key: event.target.value }
                                  : item,
                            ),
                          }))
                        }
                        placeholder="a"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Label</Label>
                      <Input
                        value={variable.label ?? ""}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            variablesSchema: current.variablesSchema.map(
                              (item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, label: event.target.value }
                                  : item,
                            ),
                          }))
                        }
                        placeholder="First number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={variable.type}
                        onValueChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            variablesSchema: current.variablesSchema.map(
                              (item, itemIndex) =>
                                itemIndex === index
                                  ? {
                                      ...item,
                                      type: value as QuestionVariableDefinition["type"],
                                      min: value === "number" ? item.min ?? 1 : undefined,
                                      max: value === "number" ? item.max ?? 10 : undefined,
                                      step:
                                        value === "number" ? item.step ?? 1 : undefined,
                                      choices: value === "text" ? item.choices ?? [""] : [],
                                    }
                                  : item,
                            ),
                          }))
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
                          setForm((current) => ({
                            ...current,
                            variablesSchema: current.variablesSchema.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          }))
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
                            setForm((current) => ({
                              ...current,
                              variablesSchema: current.variablesSchema.map(
                                (item, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...item,
                                        min:
                                          event.target.value === ""
                                            ? undefined
                                            : Number(event.target.value),
                                      }
                                    : item,
                              ),
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
                            setForm((current) => ({
                              ...current,
                              variablesSchema: current.variablesSchema.map(
                                (item, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...item,
                                        max:
                                          event.target.value === ""
                                            ? undefined
                                            : Number(event.target.value),
                                      }
                                    : item,
                              ),
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
                            setForm((current) => ({
                              ...current,
                              variablesSchema: current.variablesSchema.map(
                                (item, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...item,
                                        step:
                                          event.target.value === ""
                                            ? undefined
                                            : Number(event.target.value),
                                      }
                                    : item,
                              ),
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
                          setForm((current) => ({
                            ...current,
                            variablesSchema: current.variablesSchema.map(
                              (item, itemIndex) =>
                                itemIndex === index
                                  ? {
                                      ...item,
                                      choices: event.target.value
                                        .split(",")
                                        .map((choice) => choice.trim()),
                                    }
                                  : item,
                            ),
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
                No variables yet. Add one or choose a quick start template to begin
                using placeholders like
                <span className="mx-1 font-semibold text-slate-900">{"{{a}}"}</span>
                in your question text.
              </div>
            )}
          </div>
        </div>
      ) : null}

      {isOptionType ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                {isMatching ? "Matching pairs" : "Options"}
              </h3>
              <p className="text-sm text-slate-600">
                {isVariableMode
                  ? "Option text can also use placeholders like {{a}}."
                  : isMatching
                    ? "Add left and right pairs. Learners will match both sides."
                    : "Add answer choices and mark the correct one(s)."}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full border-slate-300/80 bg-white sm:w-auto"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  options: [
                    ...current.options,
                    {
                      label: isMatching
                        ? `Item ${current.options.length + 1}`
                        : String.fromCharCode(65 + current.options.length),
                      text: "",
                      isCorrect: isMatching,
                    },
                  ],
                }))
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              {isMatching ? "Add pair" : "Add option"}
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
                      setForm((current) => ({
                        ...current,
                        options: current.options.map((item, itemIndex) =>
                          itemIndex === index
                            ? {
                                ...item,
                                label: event.target.value,
                                isCorrect: isMatching ? true : item.isCorrect,
                              }
                            : item,
                        ),
                      }))
                    }
                    placeholder={isMatching ? `Item ${index + 1}` : `Option ${index + 1}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isMatching ? "Match text" : "Option text"}</Label>
                  <Input
                    value={option.text}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        options: current.options.map((item, itemIndex) =>
                          itemIndex === index
                            ? {
                                ...item,
                                text: event.target.value,
                                isCorrect: isMatching ? true : item.isCorrect,
                              }
                            : item,
                        ),
                      }))
                    }
                    placeholder={
                      isVariableMode
                        ? isMatching
                          ? "Example: {{term}}"
                          : "Example: {{a}} + {{b}}"
                        : isMatching
                          ? "Write matching value"
                          : "Write answer choice"
                    }
                  />
                  {isVariableMode && previewVariables.length ? (
                    <VariableInsertRow
                      variables={previewVariables}
                      label={`Insert into option ${option.label ?? index + 1}`}
                      onInsert={(key) =>
                        setForm((current) => ({
                          ...current,
                          options: current.options.map((item, itemIndex) =>
                            itemIndex === index
                              ? {
                                  ...item,
                                  text: appendTemplateToken(item.text, key),
                                }
                              : item,
                          ),
                        }))
                      }
                    />
                  ) : null}
                  <MathTextPreview
                    content={option.text}
                    emptyLabel="Option preview will appear here."
                  />
                </div>
                <div className="flex items-end gap-3">
                  {!isMatching ? (
                    <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                      <Checkbox
                        checked={option.isCorrect}
                        onCheckedChange={(checked) =>
                          setForm((current) => ({
                            ...current,
                            options: current.options.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, isCorrect: checked === true }
                                : item,
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
                      setForm((current) => ({
                        ...current,
                        options:
                          current.options.length > 2
                            ? current.options.filter(
                                (_, itemIndex) => itemIndex !== index,
                              )
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
      ) : isTextAnswerType ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="answer-text">
              {form.type === "long_answer"
                ? "Sample answer (optional)"
                : `Answer text ${isVariableMode ? "(supports placeholders)" : ""}`}
            </Label>
            <Textarea
              id="answer-text"
              value={form.answerText ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  answerText: event.target.value,
                }))
              }
              placeholder={
                form.type === "true_false"
                  ? "Example: True"
                  : form.type === "long_answer"
                    ? "Optional: sample answer, marking guide, or leave blank"
                  : form.type === "fill_blank"
                    ? "Example: photosynthesis"
                  : isVariableMode
                    ? "Example: {{a}} / {{b}}"
                    : "Write the expected answer"
              }
              className="min-h-24"
            />
            <p className="text-xs leading-5 text-slate-500">
              {form.type === "long_answer"
                ? "Long answer questions do not require an answer key. Add a sample answer only if it helps teachers."
                : <>Answer text can also include LaTeX with <code>$...$</code> syntax.</>}
            </p>
            {isVariableMode && previewVariables.length ? (
              <VariableInsertRow
                variables={previewVariables}
                label="Insert into answer text"
                onInsert={(key) =>
                  setForm((current) => ({
                    ...current,
                    answerText: appendTemplateToken(current.answerText ?? "", key),
                  }))
                }
              />
            ) : null}
            <MathTextPreview
              content={form.answerText}
              emptyLabel="Answer preview will appear here."
            />
          </div>

          {isVariableMode ? (
            <div className="space-y-2">
              <Label htmlFor="answer-formula">Answer formula</Label>
              <div className="relative">
                <Sigma className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <Input
                  id="answer-formula"
                  className="pl-9"
                  value={form.answerFormula ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      answerFormula: event.target.value,
                    }))
                  }
                  placeholder="Example: (a + b) / 2"
                />
              </div>
              <p className="text-xs leading-5 text-slate-500">
                Use numeric variable keys with operators, constants, and
                functions. If formula is filled, preview will compute the answer
                automatically.
              </p>
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    Formula guide
                  </p>
                  <p className="text-sm text-slate-600">
                    Formulas calculate the final answer from numeric variables at
                    preview time and later during question rendering.
                  </p>
                </div>
                <div className="space-y-2 text-sm text-slate-700">
                  <p>
                    Supported operators: <code>+ - * / % ^</code> with
                    parentheses, so formulas like <code>(a + b) / 2</code> and
                    <code>a ^ 2 + b ^ 2</code> work.
                  </p>
                  <p>
                    Supported functions and constants: <code>sqrt()</code>,
                    <code>abs()</code>, <code>sin()</code>, <code>cos()</code>,
                    <code>tan()</code>, <code>sec()</code>, <code>csc()</code>,
                    <code>cot()</code>, <code>sind()</code>, <code>cosd()</code>,
                    <code>tand()</code>, <code>secd()</code>, <code>cscd()</code>,
                    <code>cotd()</code>, <code>asin()</code>, <code>acos()</code>,
                    <code>atan()</code>, <code>sinh()</code>, <code>cosh()</code>,
                    <code>tanh()</code>, <code>log()</code>, <code>ln()</code>,
                    <code>exp()</code>, <code>pow()</code>, <code>fact()</code>,
                    <code>npr()</code>, <code>ncr()</code>, <code>gcd()</code>,
                    <code>lcm()</code>, <code>if()</code>, <code>min()</code>,
                    <code>max()</code>, <code>round()</code>, <code>floor()</code>,
                    <code>ceil()</code>, <code>pi</code>, <code>e</code>,
                    <code>rad()</code>, <code>deg()</code>.
                  </p>
                  <p>
                    Degree trig uses <code>sind()</code>, <code>cosd()</code>,
                    <code>tand()</code>. Standard <code>sin()</code>,
                    <code>cos()</code>, <code>tan()</code> use radians. Piecewise
                    logic works with comparisons like <code>a &gt; b</code> inside
                    <code>if(condition, trueValue, falseValue)</code>.
                  </p>
                  <p>
                    Not supported yet: equation solving, symbolic algebra, exact
                    fractions, matrices, sigma notation, or custom output formatting.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">rows * columns</Badge>
                  <Badge variant="outline">(a + b) / 2</Badge>
                  <Badge variant="outline">pi * r ^ 2</Badge>
                  <Badge variant="outline">price * quantity</Badge>
                  <Badge variant="outline">sqrt(a ^ 2 + b ^ 2)</Badge>
                  <Badge variant="outline">a1 + (n - 1) * d</Badge>
                  <Badge variant="outline">a1 * (r ^ (n - 1))</Badge>
                  <Badge variant="outline">log(a, 10)</Badge>
                  <Badge variant="outline">sind(theta)</Badge>
                  <Badge variant="outline">if(a &gt; b, a, b)</Badge>
                  <Badge variant="outline">
                    if(distance &lt;= included, base, base + ...)
                  </Badge>
                  <Badge variant="outline">ncr(n, r)</Badge>
                </div>
              </div>
              {numericVariableKeys.length >= 1 ? (
                <div className="flex flex-wrap gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-3 py-3">
                  <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                    Quick formulas
                  </span>
                  {FORMULA_SNIPPETS.filter(
                    (snippet) => numericVariableKeys.length >= snippet.minVariables,
                  ).map((snippet) => (
                    <Button
                      key={snippet.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 border-slate-300/80 bg-white px-3 text-xs"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          answerFormula: snippet.buildFormula(
                            numericVariableKeys.map((variable) => variable.key),
                          ),
                        }))
                      }
                    >
                      {snippet.label}
                    </Button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="explanation">
          Explanation {isVariableMode ? "(supports placeholders)" : ""}
        </Label>
        <Textarea
          id="explanation"
          value={form.explanation ?? ""}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              explanation: event.target.value,
            }))
          }
          placeholder="Optional explanation shown for reviewers or later learners"
          className="min-h-24"
        />
        <p className="text-xs leading-5 text-slate-500">
          Explanation supports the same LaTeX syntax, so worked solutions can show
          fractions, roots, and equations clearly.
        </p>
        {isVariableMode && previewVariables.length ? (
          <VariableInsertRow
            variables={previewVariables}
            label="Insert into explanation"
            onInsert={(key) =>
              setForm((current) => ({
                ...current,
                explanation: appendTemplateToken(current.explanation ?? "", key),
              }))
            }
          />
        ) : null}
        <MathTextPreview
          content={form.explanation}
          emptyLabel="Explanation preview will appear here."
        />
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900">Preview</h3>
            <p className="text-sm text-slate-600">
              Render a sample question to check placeholders, formulas, and final
              output before saving.
            </p>
          </div>
          {isPreviewing ? (
            <p className="text-sm font-medium text-slate-600">Generating preview...</p>
          ) : null}
        </div>

        {isVariableMode && previewVariables.length ? (
          <div className="rounded-2xl border border-white/80 bg-white/90 px-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="preview-values" className="border-b-0">
                <AccordionTrigger className="py-4 text-left hover:no-underline">
                  <div className="space-y-1 pr-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      Preview values
                    </p>
                    <p className="text-sm font-normal text-slate-600">
                      Optional manual sample values. Leave this closed if random samples are enough.
                    </p>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {previewVariables.map((variable) => (
                      <div key={variable.key} className="space-y-2">
                        <Label htmlFor={`preview-${variable.key}`}>
                          {variable.label?.trim() || variable.key}
                        </Label>
                        {variable.type === "text" && variable.choices?.length ? (
                          <Select
                            value={previewValues[variable.key] ?? ""}
                            onValueChange={(value) =>
                              setPreviewValues((current) => ({
                                ...current,
                                [variable.key]: value,
                              }))
                            }
                          >
                            <SelectTrigger
                              id={`preview-${variable.key}`}
                              className="w-full"
                            >
                              <SelectValue placeholder="Select sample value" />
                            </SelectTrigger>
                            <SelectContent>
                              {variable.choices.map((choice) => (
                                <SelectItem
                                  key={`${variable.key}-${choice}`}
                                  value={choice}
                                >
                                  {choice}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            id={`preview-${variable.key}`}
                            type={variable.type === "number" ? "number" : "text"}
                            step={
                              variable.type === "number"
                                ? variable.step ?? 1
                                : undefined
                            }
                            min={variable.type === "number" ? variable.min : undefined}
                            max={variable.type === "number" ? variable.max : undefined}
                            value={previewValues[variable.key] ?? ""}
                            onChange={(event) =>
                              setPreviewValues((current) => ({
                                ...current,
                                [variable.key]: event.target.value,
                              }))
                            }
                            placeholder={
                              variable.type === "number"
                                ? `${variable.min ?? 1}`
                                : (variable.choices ?? []).join(", ")
                            }
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        ) : null}

        {previewResults.length ? (
          <div className="space-y-3">
            {previewResults.length > 1 ? (
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  Rendered samples
                </p>
                <p className="text-sm text-slate-600">
                  Multiple sample renders make it easier to inspect how your
                  variables behave across different values.
                </p>
              </div>
            ) : null}
            <div
              className={
                previewResults.length > 1 ? "grid gap-4 xl:grid-cols-2" : "grid gap-4"
              }
            >
              {previewResults.map((preview, index) => (
                <QuestionPreviewCard
                  key={`preview-result-${index}`}
                  preview={preview}
                  title={
                    previewResults.length > 1
                      ? `Rendered sample ${index + 1}`
                      : "Rendered sample"
                  }
                  description={
                    previewResults.length > 1
                      ? "Generated from the current variable rules."
                      : "This sample uses your manual preview values when provided."
                  }
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-4 py-5 text-sm text-slate-600">
            Generate a preview to inspect the rendered output here.
          </div>
        )}
      </div>

      <div className="sticky bottom-3 z-20 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.55)] backdrop-blur-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            Review preview, then save your question.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            {onPreview ? (
              <Button
                type="button"
                variant="outline"
                className="w-full border-slate-300/80 bg-white sm:w-auto"
                disabled={isPreviewing || isSubmitting}
                onClick={() => {
                  void handlePreview();
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                {isPreviewing
                  ? "Generating..."
                  : isVariableMode
                    ? "Generate samples"
                    : "Generate preview"}
              </Button>
            ) : null}
            <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
              {isSubmitting ? "Saving question..." : submitLabel}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
