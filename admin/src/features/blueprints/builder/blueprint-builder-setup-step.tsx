import type { Dispatch, SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PagePanel } from "@/components/page-container";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { QuestionMeta } from "@/features/questions/types/question.type";
import { blueprintPdfTemplateOptions } from "./blueprint-builder.constants";
import type { BlueprintFormDraft } from "./blueprint-builder.model";
import type { PaperBlueprintMode, PaperBlueprintStatus } from "../types";

type BlueprintBuilderSetupStepProps = {
  draft: BlueprintFormDraft;
  onDraftChange: Dispatch<SetStateAction<BlueprintFormDraft>>;
  meta: QuestionMeta | undefined;
  subjects: Array<{ id: string; name: string }>;
};

export function BlueprintBuilderSetupStep({
  draft,
  onDraftChange,
  meta,
  subjects,
}: BlueprintBuilderSetupStepProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="blueprint-title-page">Title</Label>
          <Input
            id="blueprint-title-page"
            value={draft.title}
            onChange={(event) => onDraftChange((current) => ({ ...current, title: event.target.value }))}
            placeholder="Grade 12 Midterm Blueprint A"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Mode</Label>
            <Select
              value={draft.mode}
              onValueChange={(value) => onDraftChange((current) => ({ ...current, mode: value as PaperBlueprintMode }))}
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mcq_only">MCQ only</SelectItem>
                <SelectItem value="all_type">All type</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={draft.status}
              onValueChange={(value) =>
                onDraftChange((current) => ({
                  ...current,
                  status: current.publishToUsers && value !== "ready" ? "ready" : (value as PaperBlueprintStatus),
                }))
              }
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="archived" disabled={draft.publishToUsers}>Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Total marks</Label>
            <Input
              type="number"
              min={1}
              value={draft.totalMarks}
              onChange={(event) => onDraftChange((current) => ({ ...current, totalMarks: event.target.value }))}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Label>Grade</Label>
          <Select
            value={draft.gradeId || "__none__"}
            onValueChange={(value) =>
              onDraftChange((current) => ({
                ...current,
                gradeId: value === "__none__" ? "" : value,
                subjectId: "",
                presetChapterIds: [],
                presetSubChapterIds: [],
              }))
            }
          >
            <SelectTrigger className="w-full"><SelectValue placeholder="Select a grade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Select a grade</SelectItem>
              {(meta?.grades ?? []).map((grade) => <SelectItem key={grade.id} value={grade.id}>{grade.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Subject</Label>
          <Select
            value={draft.subjectId || "__none__"}
            onValueChange={(value) =>
              onDraftChange((current) => ({
                ...current,
                subjectId: value === "__none__" ? "" : value,
                presetChapterIds: [],
                presetSubChapterIds: [],
              }))
            }
            disabled={!draft.gradeId}
          >
            <SelectTrigger className="w-full"><SelectValue placeholder="Select a subject" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Select a subject</SelectItem>
              {subjects.map((subject) => <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <PagePanel className="space-y-4 bg-slate-50/80">
        <div className="space-y-1">
          <h3 className="text-base font-bold tracking-tight text-slate-900">PDF style</h3>
          <p className="text-sm text-slate-500">
            Keep this generic for most subjects, or switch to Myanmar Matric when you want formal exam-paper formatting.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {blueprintPdfTemplateOptions.map((option) => {
            const active = draft.pdfTemplateKey === option.value;
            return (
              <button
                key={option.value}
                type="button"
                className={cn(
                  "rounded-2xl border px-4 py-4 text-left transition",
                  active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-900 hover:border-slate-300",
                )}
                onClick={() =>
                  onDraftChange((current) => ({
                    ...current,
                    pdfTemplateKey: option.value,
                    timeAllowedLabel: option.value === "myanmar_matric" && !current.timeAllowedLabel.trim() ? "(3) Hours" : current.timeAllowedLabel,
                    departmentLine: option.value === "myanmar_matric" && !current.departmentLine.trim() ? "DEPARTMENT OF MYANMAR EXAMINATION" : current.departmentLine,
                    answerInstructionLine: option.value === "myanmar_matric" && !current.answerInstructionLine.trim() ? "WRITE YOUR ANSWERS IN THE ANSWER BOOKLET." : current.answerInstructionLine,
                  }))
                }
              >
                <p className="text-sm font-semibold">{option.label}</p>
                <p className={cn("mt-1 text-xs", active ? "text-slate-200" : "text-slate-500")}>{option.description}</p>
              </button>
            );
          })}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="blueprint-exam-year">Exam year label</Label>
            <Input id="blueprint-exam-year" value={draft.examYearLabel} onChange={(event) => onDraftChange((current) => ({ ...current, examYearLabel: event.target.value }))} placeholder={draft.pdfTemplateKey === "myanmar_matric" ? "2020" : "Optional"} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="blueprint-time-allowed">Time allowed</Label>
            <Input id="blueprint-time-allowed" value={draft.timeAllowedLabel} onChange={(event) => onDraftChange((current) => ({ ...current, timeAllowedLabel: event.target.value }))} placeholder={draft.pdfTemplateKey === "myanmar_matric" ? "(3) Hours" : "Optional"} />
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="blueprint-department-line">Department line</Label>
            <Input id="blueprint-department-line" value={draft.departmentLine} onChange={(event) => onDraftChange((current) => ({ ...current, departmentLine: event.target.value }))} placeholder={draft.pdfTemplateKey === "myanmar_matric" ? "DEPARTMENT OF MYANMAR EXAMINATION" : "Optional"} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="blueprint-answer-instruction">Instruction line</Label>
            <Input id="blueprint-answer-instruction" value={draft.answerInstructionLine} onChange={(event) => onDraftChange((current) => ({ ...current, answerInstructionLine: event.target.value }))} placeholder={draft.pdfTemplateKey === "myanmar_matric" ? "WRITE YOUR ANSWERS IN THE ANSWER BOOKLET." : "Optional"} />
          </div>
        </div>
      </PagePanel>
    </div>
  );
}
