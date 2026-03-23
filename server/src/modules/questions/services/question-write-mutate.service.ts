import { eq } from "drizzle-orm";
import { db, question as questionTable } from "@/db";
import { questionRepo } from "../question.repo";
import { invalidateQuestionReadCaches } from "./question-read.service";
import { insertQuestionOptions } from "./question-write-shared.service";

export const deleteQuestion = async (id: string) => {
  const deleted = await questionRepo.delete(id);
  invalidateQuestionReadCaches();
  return deleted;
};

const createDuplicateQuestionCode = async (sourceCode: string) => {
  const baseCode = sourceCode.replace(/-COPY-\d+$/, "");

  for (let copyIndex = 1; copyIndex <= 99; copyIndex += 1) {
    const nextCode = `${baseCode}-COPY-${copyIndex}`;
    const existingQuestion = await db.query.question.findFirst({
      where: eq(questionTable.questionCode, nextCode),
      columns: { id: true },
    });

    if (!existingQuestion) {
      return nextCode;
    }
  }

  return `${baseCode}-COPY-${Date.now()}`;
};

export const duplicateQuestion = async (id: string, createdBy?: string) => {
  const sourceQuestion = await questionRepo.findById(id);
  if (!sourceQuestion) {
    throw new Error("Question not found");
  }

  const duplicateCode = await createDuplicateQuestionCode(sourceQuestion.questionCode);
  const [duplicatedQuestion] = await db
    .insert(questionTable)
    .values({
      questionCode: duplicateCode,
      gradeId: sourceQuestion.gradeId,
      subjectId: sourceQuestion.subjectId,
      chapterId: sourceQuestion.chapterId,
      subChapterId: sourceQuestion.subChapterId,
      type: sourceQuestion.type,
      difficulty: sourceQuestion.difficulty,
      mode: sourceQuestion.mode,
      body: sourceQuestion.body,
      explanation: sourceQuestion.explanation,
      answerText: sourceQuestion.answerText,
      answerFormula: sourceQuestion.answerFormula,
      variablesSchema: sourceQuestion.variablesSchema ?? null,
      reviewStatus: "draft",
      reviewNotes: null,
      marks: sourceQuestion.marks,
      isPublished: false,
      isActive: sourceQuestion.isActive,
      createdBy,
      reviewedBy: null,
      reviewedAt: null,
    })
    .returning();

  await insertQuestionOptions(duplicatedQuestion.id, sourceQuestion.options);

  invalidateQuestionReadCaches();
  return questionRepo.findById(duplicatedQuestion.id);
};
