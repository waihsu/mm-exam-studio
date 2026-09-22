import type { QuestionMeta } from "@/features/questions/types/question.type";
import type {
  PaperBlueprintDifficulty,
  PaperBlueprintSectionInput,
  PaperBlueprintSlotInput,
} from "../types";

export const getBlueprintSubChaptersForSelectedChapters = (
  meta: QuestionMeta | undefined,
  chapterIds: string[],
) => {
  if (!meta || chapterIds.length === 0) return [];
  const allowed = new Set(chapterIds);
  return meta.subChapters.filter((subChapter) => allowed.has(subChapter.chapterId));
};

export const getBlueprintSubChaptersForSingleChapter = (
  meta: QuestionMeta | undefined,
  chapterId: string,
) => {
  if (!meta || !chapterId) return [];
  return meta.subChapters.filter((subChapter) => subChapter.chapterId === chapterId);
};

export const createAllTypePresetSections = (): PaperBlueprintSectionInput[] => [
  { code: "A", title: "Section A · MCQ", questionType: "mcq", marksPerQuestion: 1, questionCount: 10, totalMarks: 10, sortOrder: 1 },
  { code: "B", title: "Section B · True/False", questionType: "true_false", marksPerQuestion: 1, questionCount: 5, totalMarks: 5, sortOrder: 2 },
  { code: "C", title: "Section C · Fill in the blank", questionType: "fill_blank", marksPerQuestion: 1, questionCount: 5, totalMarks: 5, sortOrder: 3 },
  { code: "D", title: "Section D · Short answer (2 marks)", questionType: "short_answer", marksPerQuestion: 2, questionCount: 5, totalMarks: 10, sortOrder: 4 },
  { code: "E", title: "Section E · Short answer (3 marks)", questionType: "short_answer", marksPerQuestion: 3, questionCount: 5, totalMarks: 15, sortOrder: 5 },
  { code: "F", title: "Section F · Matching", questionType: "matching", marksPerQuestion: 5, questionCount: 1, totalMarks: 5, sortOrder: 6 },
];

export const createCustomPresetSections = (): PaperBlueprintSectionInput[] => [
  { code: "A", title: "Section A · MCQ", questionType: "mcq", marksPerQuestion: 1, questionCount: 10, totalMarks: 10, sortOrder: 1 },
  { code: "B", title: "Section B · 2-mark questions", questionType: "short_answer", marksPerQuestion: 2, questionCount: 5, totalMarks: 10, sortOrder: 2 },
  { code: "C", title: "Section C · 3-mark questions", questionType: "short_answer", marksPerQuestion: 3, questionCount: 5, totalMarks: 15, sortOrder: 3 },
  { code: "D", title: "Section D · Matching", questionType: "matching", marksPerQuestion: 5, questionCount: 3, totalMarks: 15, sortOrder: 4 },
];

export const createCustomPresetSlots = (
  sections: PaperBlueprintSectionInput[],
): PaperBlueprintSlotInput[] => {
  const difficultyCycle: PaperBlueprintDifficulty[] = ["easy", "normal", "hard", "advance"];
  const slots: PaperBlueprintSlotInput[] = [];
  let slotNumber = 1;

  for (const section of sections) {
    const questionType = section.questionType ?? "mcq";
    const marks = section.marksPerQuestion ?? 1;
    for (let index = 0; index < section.questionCount; index += 1) {
      slots.push({
        sectionCode: section.code,
        slotNumber,
        questionType,
        marks,
        difficultyTarget: difficultyCycle[(slotNumber - 1) % difficultyCycle.length],
        swapLimit: 3,
      });
      slotNumber += 1;
    }
  }

  return slots;
};

export const getBlueprintSectionTotalMarks = (sections: PaperBlueprintSectionInput[]) =>
  sections.reduce((sum, section) => sum + section.totalMarks, 0);

export const hasBlueprintJsonContent = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed !== "[]";
};
