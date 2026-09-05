import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { QuestionVariableDefinition } from "../types/question.type";

type QuestionFormPreviewValuesProps = {
  variables: QuestionVariableDefinition[];
  values: Record<string, string>;
  onValueChange: (key: string, value: string) => void;
};

export function QuestionFormPreviewValues({
  variables,
  values,
  onValueChange,
}: QuestionFormPreviewValuesProps) {
  if (variables.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/80 bg-white/90 px-4">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="preview-values" className="border-b-0">
          <AccordionTrigger className="py-4 text-left hover:no-underline">
            <div className="space-y-1 pr-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Preview values</p>
              <p className="text-sm font-normal text-slate-600">Optional manual sample values. Leave this closed if random samples are enough.</p>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {variables.map((variable) => (
                <div key={variable.key} className="space-y-2">
                  <Label htmlFor={`preview-${variable.key}`}>
                    {variable.label?.trim() || variable.key}
                  </Label>
                  {variable.type === "text" && variable.choices?.length ? (
                    <Select
                      value={values[variable.key] ?? ""}
                      onValueChange={(value) => onValueChange(variable.key, value)}
                    >
                      <SelectTrigger id={`preview-${variable.key}`} className="w-full">
                        <SelectValue placeholder="Select sample value" />
                      </SelectTrigger>
                      <SelectContent>
                        {variable.choices.map((choice) => (
                          <SelectItem key={`${variable.key}-${choice}`} value={choice}>{choice}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={`preview-${variable.key}`}
                      type={variable.type === "number" ? "number" : "text"}
                      step={variable.type === "number" ? variable.step ?? 1 : undefined}
                      min={variable.type === "number" ? variable.min : undefined}
                      max={variable.type === "number" ? variable.max : undefined}
                      value={values[variable.key] ?? ""}
                      onChange={(event) => onValueChange(variable.key, event.target.value)}
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
  );
}
