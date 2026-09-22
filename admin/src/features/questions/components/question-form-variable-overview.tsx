import { Sparkles, Variable } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export function QuestionFormVariableOverview() {
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Variable className="h-4 w-4 text-sky-700" />
            <h3 className="text-sm font-bold text-slate-900">Variable mode is active</h3>
          </div>
          <p className="text-sm leading-6 text-slate-700">
            Use placeholders like <code>{"{{a}}"}</code> inside question body, explanation, answer text, or choice options. Add an answer formula when the final answer should be computed from numeric variables.
          </p>
        </div>
        <div className="space-y-2 rounded-2xl border border-white/80 bg-white/90 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Supported now</p>
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
          This creates one template question record. Preview and exam generation will render different values later, instead of saving many separate questions now.
        </AlertDescription>
      </Alert>
    </>
  );
}
