import { MathTextPreview } from "./math-text-preview";
import { VariableInsertRow } from "./question-form-variable-insert-row";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { QuestionVariableDefinition } from "../types/question.type";

type QuestionFormExplanationProps = {
  value: string;
  variableMode: boolean;
  variables: QuestionVariableDefinition[];
  onChange: (value: string) => void;
  onInsertVariable: (key: string) => void;
};

export function QuestionFormExplanation({
  value,
  variableMode,
  variables,
  onChange,
  onInsertVariable,
}: QuestionFormExplanationProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="explanation">Explanation {variableMode ? "(supports placeholders)" : ""}</Label>
      <Textarea
        id="explanation"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Optional explanation shown for reviewers or later learners"
        className="min-h-24"
      />
      <p className="text-xs leading-5 text-slate-500">
        Explanation supports the same LaTeX syntax, so worked solutions can show fractions, roots, and equations clearly.
      </p>
      {variableMode && variables.length ? (
        <VariableInsertRow variables={variables} label="Insert into explanation" onInsert={onInsertVariable} />
      ) : null}
      <MathTextPreview content={value} emptyLabel="Explanation preview will appear here." />
    </div>
  );
}
