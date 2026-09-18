import type { Dispatch, SetStateAction } from "react";
import { Sigma } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MathTextPreview } from "../math-text-preview";
import { VariableInsertRow } from "../question-form-variable-insert-row";
import { FORMULA_SNIPPETS } from "../question-form.constants";
import { appendTemplateToken } from "../question-form.helpers";
import type { QuestionInput } from "../../schema/question.schema";
import type { QuestionVariableDefinition } from "../../types/question.type";

type QuestionTextAnswerEditorProps = {
  form: QuestionInput;
  variableMode: boolean;
  variables: QuestionVariableDefinition[];
  numericVariables: QuestionVariableDefinition[];
  onFormChange: Dispatch<SetStateAction<QuestionInput>>;
};

export function QuestionTextAnswerEditor({
  form,
  variableMode,
  variables,
  numericVariables,
  onFormChange,
}: QuestionTextAnswerEditorProps) {
  return (
    <div id="question-answer" className="scroll-mt-24 grid gap-4 lg:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="answer-text">
          {form.type === "long_answer"
            ? "Sample answer (optional)"
            : `Answer text ${variableMode ? "(supports placeholders)" : ""}`}
        </Label>
        <Textarea
          id="answer-text"
          value={form.answerText ?? ""}
          onChange={(event) =>
            onFormChange((current) => ({ ...current, answerText: event.target.value }))
          }
          placeholder={
            form.type === "true_false"
              ? "Example: True"
              : form.type === "long_answer"
                ? "Optional: sample answer, marking guide, or leave blank"
                : form.type === "fill_blank"
                  ? "Example: photosynthesis"
                  : variableMode
                    ? "Example: {{a}} / {{b}}"
                    : "Write the expected answer"
          }
          className="min-h-24"
        />
        <p className="text-xs leading-5 text-slate-500">
          {form.type === "long_answer" ? (
            "Long answer questions do not require an answer key. Add a sample answer only if it helps teachers."
          ) : (
            <>Answer text can also include LaTeX with <code>$...$</code> syntax.</>
          )}
        </p>
        {variableMode && variables.length ? (
          <VariableInsertRow
            variables={variables}
            label="Insert into answer text"
            onInsert={(key) =>
              onFormChange((current) => ({
                ...current,
                answerText: appendTemplateToken(current.answerText ?? "", key),
              }))
            }
          />
        ) : null}
        <MathTextPreview content={form.answerText} emptyLabel="Answer preview will appear here." />
      </div>

      {variableMode ? (
        <div className="space-y-2">
          <Label htmlFor="answer-formula">Answer formula</Label>
          <div className="relative">
            <Sigma className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <Input
              id="answer-formula"
              className="pl-9"
              value={form.answerFormula ?? ""}
              onChange={(event) =>
                onFormChange((current) => ({ ...current, answerFormula: event.target.value }))
              }
              placeholder="Example: (a + b) / 2"
            />
          </div>
          <p className="text-xs leading-5 text-slate-500">
            Use numeric variable keys with operators, constants, and functions. If formula is filled, preview will compute the answer automatically.
          </p>
          <FormulaGuide />
          {numericVariables.length >= 1 ? (
            <div className="flex flex-wrap gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-3 py-3">
              <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Quick formulas</span>
              {FORMULA_SNIPPETS.filter((snippet) => numericVariables.length >= snippet.minVariables).map(
                (snippet) => (
                  <Button
                    key={snippet.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 border-slate-300/80 bg-white px-3 text-xs"
                    onClick={() =>
                      onFormChange((current) => ({
                        ...current,
                        answerFormula: snippet.buildFormula(numericVariables.map((variable) => variable.key)),
                      }))
                    }
                  >
                    {snippet.label}
                  </Button>
                ),
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function FormulaGuide() {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Formula guide</p>
        <p className="text-sm text-slate-600">Formulas calculate the final answer from numeric variables at preview time and later during question rendering.</p>
      </div>
      <div className="space-y-2 text-sm text-slate-700">
        <p>Supported operators: <code>+ - * / % ^</code> with parentheses, so formulas like <code>(a + b) / 2</code> and <code>a ^ 2 + b ^ 2</code> work.</p>
        <p>Supported functions and constants: <code>sqrt()</code>, <code>abs()</code>, <code>sin()</code>, <code>cos()</code>, <code>tan()</code>, <code>sec()</code>, <code>csc()</code>, <code>cot()</code>, <code>sind()</code>, <code>cosd()</code>, <code>tand()</code>, <code>secd()</code>, <code>cscd()</code>, <code>cotd()</code>, <code>asin()</code>, <code>acos()</code>, <code>atan()</code>, <code>sinh()</code>, <code>cosh()</code>, <code>tanh()</code>, <code>log()</code>, <code>ln()</code>, <code>exp()</code>, <code>pow()</code>, <code>fact()</code>, <code>npr()</code>, <code>ncr()</code>, <code>gcd()</code>, <code>lcm()</code>, <code>if()</code>, <code>min()</code>, <code>max()</code>, <code>round()</code>, <code>floor()</code>, <code>ceil()</code>, <code>pi</code>, <code>e</code>, <code>rad()</code>, <code>deg()</code>.</p>
        <p>Degree trig uses <code>sind()</code>, <code>cosd()</code>, <code>tand()</code>. Standard <code>sin()</code>, <code>cos()</code>, <code>tan()</code> use radians. Piecewise logic works with comparisons like <code>a &gt; b</code> inside <code>if(condition, trueValue, falseValue)</code>.</p>
        <p>Not supported yet: equation solving, symbolic algebra, exact fractions, matrices, sigma notation, or custom output formatting.</p>
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
        <Badge variant="outline">if(distance &lt;= included, base, base + ...)</Badge>
        <Badge variant="outline">ncr(n, r)</Badge>
      </div>
    </div>
  );
}
