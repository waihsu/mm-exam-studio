import type { Dispatch, SetStateAction } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { QuestionInput } from "../schema/question.schema";
import type {
  QuestionChapter,
  QuestionMeta,
  QuestionSubChapter,
  QuestionTaxonomyOption,
} from "../types/question.type";

type QuestionFormTaxonomyMappingProps = {
  form: QuestionInput;
  onFormChange: Dispatch<SetStateAction<QuestionInput>>;
  meta: QuestionMeta;
  subjects: QuestionTaxonomyOption[];
  chapters: QuestionChapter[];
  subChapters: QuestionSubChapter[];
};

export function QuestionFormTaxonomyMapping({
  form,
  onFormChange,
  meta,
  subjects,
  chapters,
  subChapters,
}: QuestionFormTaxonomyMappingProps) {
  return (
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
              onFormChange((current) => ({
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
              onFormChange((current) => ({
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
                  {subject.code ? `${subject.code} · ${subject.name}` : subject.name}
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
              onFormChange((current) => ({
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
                  {chapter.code ? `${chapter.code} · ${chapter.name}` : chapter.name}
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
              onFormChange((current) => ({
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
  );
}
