import { Button } from "@/components/ui/button";
import type { QuestionVariableDefinition } from "../types/question.type";

type VariableInsertRowProps = {
  variables: QuestionVariableDefinition[];
  label: string;
  onInsert: (key: string) => void;
};

export function VariableInsertRow({
  variables,
  label,
  onInsert,
}: VariableInsertRowProps) {
  if (!variables.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-3 py-3">
      <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
        {label}
      </span>
      {variables.map((variable) => (
        <Button
          key={variable.key}
          type="button"
          variant="outline"
          size="sm"
          className="h-8 border-slate-300/80 bg-white px-3 text-xs"
          onClick={() => {
            onInsert(variable.key);
          }}
        >
          {`{{${variable.key}}}`}
        </Button>
      ))}
    </div>
  );
}
