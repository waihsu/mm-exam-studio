import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { QuestionChapter, QuestionSubChapter } from "@/features/questions/types/question.type";
import type { PaperBlueprintSlotInput } from "../types";

type BlueprintSlotTaxonomyFiltersProps = {
  slot: PaperBlueprintSlotInput;
  chapters: QuestionChapter[];
  subChapters: QuestionSubChapter[];
  onChapterChange: (chapterId: string | undefined) => void;
  onSubChapterChange: (subChapterId: string | undefined) => void;
};

export function BlueprintSlotTaxonomyFilters({
  slot,
  chapters,
  subChapters,
  onChapterChange,
  onSubChapterChange,
}: BlueprintSlotTaxonomyFiltersProps) {
  return (
    <>
      <div className="space-y-2">
        <Label>Chapter</Label>
        <Select
          value={slot.chapterId ?? "__none__"}
          onValueChange={(value) => onChapterChange(value === "__none__" ? undefined : value)}
        >
          <SelectTrigger className="w-full"><SelectValue placeholder="Optional" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Optional</SelectItem>
            {chapters.map((chapter) => (
              <SelectItem key={chapter.id} value={chapter.id}>
                {chapter.code ? `${chapter.code} · ${chapter.name}` : chapter.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Lesson</Label>
        <Select
          value={slot.subChapterId ?? "__none__"}
          onValueChange={(value) => onSubChapterChange(value === "__none__" ? undefined : value)}
          disabled={!slot.chapterId}
        >
          <SelectTrigger className="w-full"><SelectValue placeholder="Optional" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Optional</SelectItem>
            {subChapters.map((subChapter) => (
              <SelectItem key={subChapter.id} value={subChapter.id}>
                {subChapter.code ? `${subChapter.code} · ${subChapter.name}` : subChapter.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
