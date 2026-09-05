import { useEffect, useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MathTextPreview } from "./math-text-preview";
import {
  PRESET_CATEGORY_ALL,
  VARIABLE_PRESETS,
  getDefaultMarksForType,
  isAllowedMarksForType,
  QUESTION_MARK_OPTIONS,
  type VariablePreset,
} from "./question-form.constants";
import {
  appendTemplateToken,
  createEmptyMatchingOptions,
  createEmptyOptions,
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
import { QuestionFormAuthoringSteps } from "./question-form-authoring-steps";
import { QuestionFormCoreSetup } from "./question-form-core-setup";
import { QuestionFormTaxonomyMapping } from "./question-form-taxonomy-mapping";
import { QuestionFormMediaUrls } from "./question-form-media-urls";
import { QuestionFormPublishStatus } from "./question-form-publish-status";
import { QuestionFormActions } from "./question-form-actions";
import { QuestionFormPreviewResults } from "./question-form-preview-results";
import { QuestionFormPreviewValues } from "./question-form-preview-values";
import { QuestionFormExplanation } from "./question-form-explanation";
import { QuestionFormVariableOverview } from "./question-form-variable-overview";
import { QuestionFormVariablePresets } from "./question-form-variable-presets";
import { QuestionOptionsEditor } from "./question-form/question-options-editor";
import { QuestionTextAnswerEditor } from "./question-form/question-text-answer-editor";
import { QuestionVariableSchemaEditor } from "./question-form/question-variable-schema-editor";
import { QuestionVariableValueSets } from "./question-form/question-variable-value-sets";
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
} from "../types/question.type";
import {
  getChaptersForSelection,
  getSubChaptersForChapter,
  getSubjectsForGrade,
} from "../utils/question-taxonomy";

type QuestionFormProps = {
  meta: QuestionMeta;
  initialValue?: QuestionRecord | null;
  /** New questions are deliberately reviewed before they can enter the public bank. */
  draftOnly?: boolean;
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
  draftOnly = false,
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
    const formForSubmission = draftOnly
      ? { ...form, isPublished: false, reviewStatus: "draft" as const }
      : form;
    const validationPayload = createQuestionValidationPayload(formForSubmission);
    const parsed = questionSchema.safeParse(validationPayload);
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? "Invalid form data.");
      return null;
    }

    setErrorMessage(null);
    return createQuestionSubmitPayload(formForSubmission);
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
      parametricValueSets: [],
      variantContents: [],
      options:
        preset.type === "mcq"
          ? ensureMcqOptions(preset.options ?? createEmptyOptions())
          : createEmptyOptions(),
    }));
  };

  const parseMediaUrls = (value: string) =>
    normalizeMediaUrls(value.split(/\r?\n/g));

  const authoringStages = [
    {
      id: "question-setup",
      label: "1. Setup",
      complete: Boolean(form.questionCode.trim() && form.gradeId && form.subjectId),
    },
    {
      id: "question-content",
      label: "2. Prompt",
      complete: Boolean(form.body.trim()),
    },
    {
      id: "question-answer",
      label: "3. Answer",
      complete:
        isOptionType
          ? form.options.some((option) => option.text.trim())
          : Boolean(form.answerText?.trim() || form.answerFormula?.trim()),
    },
    {
      id: "question-preview",
      label: "4. Check",
      complete: previewResults.length > 0,
    },
  ];

  const handleModeChange = (nextMode: QuestionInput["mode"]) => {
    if (nextMode === form.mode) return;

    setForm((current) => {
      if (nextMode === "static") {
        setVariableDraft({
          variablesSchema: normalizeVariableDefinitions(current.variablesSchema),
          answerFormula: current.answerFormula ?? "",
          parametricValueSets: current.parametricValueSets,
          variantContents: current.variantContents,
          previewValues,
        });
        return {
          ...current,
          mode: "static",
          variablesSchema: [],
          answerFormula: "",
          parametricValueSets: [],
          variantContents: [],
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
        answerFormula: current.answerFormula?.trim().length
          ? current.answerFormula
          : variableDraft.answerFormula,
        parametricValueSets:
          current.parametricValueSets.length > 0
            ? current.parametricValueSets
            : variableDraft.parametricValueSets,
        variantContents:
          current.variantContents.length > 0
            ? current.variantContents
            : variableDraft.variantContents,
      };
    });
  };

  const handleTypeChange = (nextType: QuestionType) => {
    setForm((current) => {
      if (nextType === current.type) return current;
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
              ? current.options.some((option) => option.text.trim() || option.label?.trim())
                ? ensureMatchingOptions(current.options)
                : createEmptyMatchingOptions()
              : createEmptyOptions(),
      };
    });
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {errorMessage ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Form needs attention</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <QuestionFormAuthoringSteps stages={authoringStages} />

      <QuestionFormCoreSetup
        form={form}
        markOptions={markOptions}
        onQuestionCodeChange={(questionCode) =>
          setForm((current) => ({ ...current, questionCode }))
        }
        onModeChange={handleModeChange}
        onTypeChange={handleTypeChange}
        onDifficultyChange={(difficulty) =>
          setForm((current) => ({ ...current, difficulty }))
        }
        onMarksChange={(marks) => setForm((current) => ({ ...current, marks }))}
        onMarksBlur={() =>
          setForm((current) => ({
            ...current,
            marks: isAllowedMarksForType(current.type, current.marks)
              ? current.marks
              : getDefaultMarksForType(current.type),
          }))
        }
        onMarkSelect={(marks) => setForm((current) => ({ ...current, marks }))}
      />

      {isVariableMode ? (
        <div className="space-y-4 rounded-2xl border border-sky-200 bg-sky-50/70 p-4">
          <QuestionFormVariableOverview />

          <QuestionFormVariablePresets
            categories={presetCategories}
            activeCategory={presetCategory}
            presets={visiblePresets}
            onCategoryChange={setPresetCategory}
            onApplyPreset={applyVariablePreset}
          />

          <QuestionVariableValueSets
            form={form}
            variables={previewVariables}
            optionType={isOptionType}
            onFormChange={setForm}
          />
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

      <div id="question-content" className="scroll-mt-24 space-y-2">
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

      <QuestionFormMediaUrls
        questionImageUrls={form.questionImageUrls}
        solutionImageUrls={form.solutionImageUrls}
        onQuestionImageUrlsChange={(value) =>
          setForm((current) => ({ ...current, questionImageUrls: parseMediaUrls(value) }))
        }
        onSolutionImageUrlsChange={(value) =>
          setForm((current) => ({ ...current, solutionImageUrls: parseMediaUrls(value) }))
        }
      />

      {draftOnly ? (
        <div className="rounded-2xl border border-sky-200 bg-sky-50/80 px-4 py-4 text-sm text-sky-950">
          <p className="font-semibold">New questions begin as drafts</p>
          <p className="mt-1 leading-6 text-sky-800">
            Save this question first, then use the review screen to inspect the
            rendered output, add reviewer notes, approve it, and publish it.
          </p>
        </div>
      ) : (
        <QuestionFormPublishStatus
          published={form.isPublished}
          onPublishedChange={(isPublished) =>
            setForm((current) => ({ ...current, isPublished }))
          }
        />
      )}

      <QuestionFormTaxonomyMapping
        form={form}
        onFormChange={setForm}
        meta={meta}
        subjects={subjects}
        chapters={chapters}
        subChapters={subChapters}
      />

      {isVariableMode ? (
        <QuestionVariableSchemaEditor form={form} onFormChange={setForm} />
      ) : null}

      {isOptionType ? (
        <QuestionOptionsEditor
          form={form}
          matching={isMatching}
          variableMode={isVariableMode}
          variables={previewVariables}
          onFormChange={setForm}
        />
      ) : isTextAnswerType ? (
        <QuestionTextAnswerEditor
          form={form}
          variableMode={isVariableMode}
          variables={previewVariables}
          numericVariables={numericVariableKeys}
          onFormChange={setForm}
        />
      ) : null}

      <QuestionFormExplanation
        value={form.explanation ?? ""}
        variableMode={isVariableMode}
        variables={previewVariables}
        onChange={(explanation) => setForm((current) => ({ ...current, explanation }))}
        onInsertVariable={(key) =>
          setForm((current) => ({
            ...current,
            explanation: appendTemplateToken(current.explanation ?? "", key),
          }))
        }
      />

      <div id="question-preview" className="scroll-mt-24 space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
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

        {isVariableMode ? (
          <QuestionFormPreviewValues
            variables={previewVariables}
            values={previewValues}
            onValueChange={(key, value) =>
              setPreviewValues((current) => ({ ...current, [key]: value }))
            }
          />
        ) : null}

        <QuestionFormPreviewResults previews={previewResults} />
      </div>

      <QuestionFormActions
        previewEnabled={Boolean(onPreview)}
        previewing={isPreviewing}
        submitting={isSubmitting}
        variableMode={isVariableMode}
        submitLabel={submitLabel}
        submitHint={
          draftOnly
            ? "Preview the content, then save a draft for review and publishing."
            : "Review preview, then save your question."
        }
        onPreview={() => void handlePreview()}
      />
    </form>
  );
}
