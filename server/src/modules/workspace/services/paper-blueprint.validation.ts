import { and, eq, inArray } from "drizzle-orm";
import {
  chapter,
  db,
  grade,
  gradeSubject,
  paperBlueprintSection,
  paperBlueprintSlot,
  question,
  subChapter,
  subject,
} from "@/db";
import type {
  CreatePaperBlueprintInput,
  PaperBlueprintSectionInput,
  PaperBlueprintSlotInput,
} from "../paper-blueprint.schema";
import { dedupe, normalizePresetConfig } from "./paper-blueprint.utils";

export const assertBlueprintMath = (input: CreatePaperBlueprintInput) => {
  for (const section of input.sections) {
    if (
      typeof section.marksPerQuestion === "number" &&
      section.questionCount * section.marksPerQuestion !== section.totalMarks
    ) {
      throw new Error(
        `Section ${section.code} total marks must equal questionCount × marksPerQuestion.`,
      );
    }
  }

  if (input.sections.length > 0) {
    const sectionTotal = input.sections.reduce((sum, section) => sum + section.totalMarks, 0);
    if (sectionTotal !== input.totalMarks) {
      throw new Error("Section totals must match the blueprint total marks.");
    }
  }

  if (input.mode === "custom") {
    const slotTotal = input.slots.reduce((sum, slot) => sum + slot.marks, 0);
    if (slotTotal !== input.totalMarks) {
      throw new Error("Custom blueprint slot marks must match the blueprint total marks.");
    }
  }

  const sectionByCode = new Map(input.sections.map((section) => [section.code, section]));
  for (const slot of input.slots) {
    if (!slot.sectionCode) continue;
    const section = sectionByCode.get(slot.sectionCode);
    if (!section) continue;

    if (section.questionType && section.questionType !== slot.questionType) {
      throw new Error(
        `Slot ${slot.slotNumber} question type must match section ${section.code}.`,
      );
    }

    if (
      typeof section.marksPerQuestion === "number" &&
      section.marksPerQuestion !== slot.marks
    ) {
      throw new Error(`Slot ${slot.slotNumber} marks must match section ${section.code}.`);
    }
  }
};

export const assertBlueprintReferences = async (input: CreatePaperBlueprintInput) => {
  const presetConfig = normalizePresetConfig(input.presetConfig);
  const [gradeRow, subjectRow, gradeSubjectRow] = await Promise.all([
    db.query.grade.findFirst({
      where: and(eq(grade.id, input.gradeId), eq(grade.isActive, true)),
      columns: { id: true },
    }),
    db.query.subject.findFirst({
      where: and(eq(subject.id, input.subjectId), eq(subject.isActive, true)),
      columns: { id: true },
    }),
    db.query.gradeSubject.findFirst({
      where: and(
        eq(gradeSubject.gradeId, input.gradeId),
        eq(gradeSubject.subjectId, input.subjectId),
        eq(gradeSubject.isActive, true),
      ),
      columns: { gradeId: true },
    }),
  ]);

  if (!gradeRow) throw new Error("Selected grade was not found.");
  if (!subjectRow) throw new Error("Selected subject was not found.");
  if (!gradeSubjectRow) {
    throw new Error("Selected grade and subject are not linked in the curriculum.");
  }

  const presetChapterIds = dedupe(presetConfig.chapterIds ?? []);
  const slotChapterIds = dedupe(input.slots.map((slot) => slot.chapterId));
  const chapterIds = dedupe([...presetChapterIds, ...slotChapterIds]);
  if (chapterIds.length > 0) {
    const chapterRows = await db.query.chapter.findMany({
      where: inArray(chapter.id, chapterIds),
      columns: { id: true, gradeId: true, subjectId: true },
    });
    if (chapterRows.length !== chapterIds.length) {
      throw new Error("One or more selected chapters no longer exist.");
    }

    for (const row of chapterRows) {
      if (row.gradeId !== input.gradeId || row.subjectId !== input.subjectId) {
        throw new Error("Blueprint chapters must belong to the selected grade and subject.");
      }
    }
  }

  const presetSubChapterIds = dedupe(presetConfig.subChapterIds ?? []);
  const slotSubChapterIds = dedupe(input.slots.map((slot) => slot.subChapterId));
  const subChapterIds = dedupe([...presetSubChapterIds, ...slotSubChapterIds]);
  if (subChapterIds.length > 0) {
    const subChapterRows = await db.query.subChapter.findMany({
      where: inArray(subChapter.id, subChapterIds),
      columns: { id: true, chapterId: true },
    });
    if (subChapterRows.length !== subChapterIds.length) {
      throw new Error("One or more selected lessons no longer exist.");
    }

    const subChapterMap = new Map(subChapterRows.map((row) => [row.id, row.chapterId]));
    for (const presetSubChapterId of presetSubChapterIds) {
      const parentChapterId = subChapterMap.get(presetSubChapterId);
      if (!parentChapterId) continue;
      if (presetChapterIds.length > 0 && !presetChapterIds.includes(parentChapterId)) {
        throw new Error("Preset lessons must belong to one of the preset chapters.");
      }
    }

    for (const slot of input.slots) {
      if (!slot.subChapterId) continue;
      if (subChapterMap.get(slot.subChapterId) !== slot.chapterId) {
        throw new Error(
          `Slot ${slot.slotNumber} sub chapter must belong to the selected chapter.`,
        );
      }
    }
  }

  const lockedQuestionIds = dedupe(input.slots.map((slot) => slot.lockedQuestionId));
  if (lockedQuestionIds.length > 0) {
    const questionRows = await db.query.question.findMany({
      where: inArray(question.id, lockedQuestionIds),
      columns: {
        id: true,
        gradeId: true,
        subjectId: true,
        chapterId: true,
        subChapterId: true,
        type: true,
        marks: true,
        isPublished: true,
        isActive: true,
      },
    });

    if (questionRows.length !== lockedQuestionIds.length) {
      throw new Error("One or more locked questions could not be found.");
    }

    const questionMap = new Map(questionRows.map((row) => [row.id, row]));
    for (const slot of input.slots) {
      if (!slot.lockedQuestionId) continue;
      const lockedQuestion = questionMap.get(slot.lockedQuestionId);
      if (!lockedQuestion) {
        throw new Error(`Locked question for slot ${slot.slotNumber} was not found.`);
      }
      if (!lockedQuestion.isActive || !lockedQuestion.isPublished) {
        throw new Error(`Locked question for slot ${slot.slotNumber} must be published.`);
      }
      if (
        lockedQuestion.gradeId !== input.gradeId ||
        lockedQuestion.subjectId !== input.subjectId
      ) {
        throw new Error(
          `Locked question for slot ${slot.slotNumber} must match the blueprint grade and subject.`,
        );
      }
      if (lockedQuestion.type !== slot.questionType || lockedQuestion.marks !== slot.marks) {
        throw new Error(
          `Locked question for slot ${slot.slotNumber} must match the slot question type and marks.`,
        );
      }
      if (slot.chapterId && lockedQuestion.chapterId !== slot.chapterId) {
        throw new Error(`Locked question for slot ${slot.slotNumber} must match its chapter.`);
      }
      if (slot.subChapterId && lockedQuestion.subChapterId !== slot.subChapterId) {
        throw new Error(
          `Locked question for slot ${slot.slotNumber} must match its sub chapter.`,
        );
      }
    }
  }
};

export const replaceBlueprintChildren = async (
  blueprintId: string,
  sections: PaperBlueprintSectionInput[],
  slots: PaperBlueprintSlotInput[],
) => {
  await db.delete(paperBlueprintSlot).where(eq(paperBlueprintSlot.blueprintId, blueprintId));
  await db.delete(paperBlueprintSection).where(eq(paperBlueprintSection.blueprintId, blueprintId));

  const sectionCodeToId = new Map<string, string>();
  if (sections.length > 0) {
    const insertedSections = await db
      .insert(paperBlueprintSection)
      .values(
        sections.map((section) => ({
          blueprintId,
          code: section.code,
          title: section.title ?? null,
          questionType: section.questionType ?? null,
          marksPerQuestion: section.marksPerQuestion ?? null,
          questionCount: section.questionCount,
          totalMarks: section.totalMarks,
          sortOrder: section.sortOrder,
        })),
      )
      .returning();

    for (const section of insertedSections) {
      sectionCodeToId.set(section.code, section.id);
    }
  }

  if (slots.length > 0) {
    await db.insert(paperBlueprintSlot).values(
      slots.map((slot) => ({
        blueprintId,
        sectionId: slot.sectionCode ? (sectionCodeToId.get(slot.sectionCode) ?? null) : null,
        slotNumber: slot.slotNumber,
        questionType: slot.questionType,
        marks: slot.marks,
        difficultyTarget: slot.difficultyTarget ?? null,
        chapterId: slot.chapterId ?? null,
        subChapterId: slot.subChapterId ?? null,
        lockedQuestionId: slot.lockedQuestionId ?? null,
        swapLimit: slot.swapLimit,
        slotConfig: slot.slotConfig ?? null,
      })),
    );
  }
};
