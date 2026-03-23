import { and, eq } from "drizzle-orm";
import { db, questionPaper } from "@/db";
import { toRenderedOptions } from "../workspace.mapper";

export const getQuestionPaperDetail = async (userId: string, paperId: string) => {
  const paper = await db.query.questionPaper.findFirst({
    where: and(eq(questionPaper.id, paperId), eq(questionPaper.userId, userId)),
    with: {
      brandAsset: {
        columns: {
          id: true,
          label: true,
          imageDataUrl: true,
          isPrimary: true,
        },
      },
      user: {
        columns: {
          name: true,
          email: true,
        },
      },
      grade: {
        columns: { id: true, name: true, code: true },
      },
      subject: {
        columns: { id: true, name: true, code: true },
      },
      chapter: {
        columns: { id: true, name: true, code: true },
      },
      subChapter: {
        columns: { id: true, name: true, code: true },
      },
      items: {
        orderBy: (table, { asc }) => [asc(table.position)],
      },
    },
  });

  if (!paper) {
    throw new Error("Question paper not found.");
  }

  return {
    id: paper.id,
    title: paper.title,
    instructions: paper.instructions,
    schoolName: paper.schoolName,
    brandAsset: paper.brandAsset
      ? {
          id: paper.brandAsset.id,
          label: paper.brandAsset.label,
          imageDataUrl: paper.brandAsset.imageDataUrl,
          isPrimary: paper.brandAsset.isPrimary,
        }
      : null,
    academicYear: paper.academicYear,
    includeAnswerKey: paper.includeAnswerKey,
    status: paper.status,
    totalQuestions: paper.totalQuestions,
    totalMarks: paper.totalMarks,
    exportedAt: paper.exportedAt,
    createdAt: paper.createdAt,
    updatedAt: paper.updatedAt,
    grade: paper.grade,
    subject: paper.subject,
    chapter: paper.chapter,
    subChapter: paper.subChapter,
    teacherName: paper.user.name || paper.user.email || null,
    items: paper.items.map((item) => ({
      id: item.id,
      questionId: item.questionId,
      position: item.position,
      questionCode: item.questionCode,
      questionType: item.questionType,
      marks: item.marks,
      body: item.renderedBody,
      answerText: item.renderedAnswerText,
      options: toRenderedOptions(item.renderedOptions),
    })),
  };
};

