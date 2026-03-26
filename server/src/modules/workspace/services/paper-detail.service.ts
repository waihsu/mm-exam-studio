import { and, eq } from "drizzle-orm";
import { db, questionPaper } from "@/db";
import { toRenderedOptions } from "../workspace.mapper";
import { toQuestionImageUrls } from "../../questions/services/question-shared.service";

export const getQuestionPaperDetail = async (userId: string, paperId: string) => {
  const paper = await db.query.questionPaper.findFirst({
    where: and(eq(questionPaper.id, paperId), eq(questionPaper.userId, userId)),
    with: {
      blueprint: {
        columns: { id: true, title: true, mode: true, status: true },
      },
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
        with: {
          question: {
            columns: {
              questionImageUrls: true,
              solutionImageUrls: true,
            },
          },
          blueprintSection: {
            columns: { id: true, code: true, title: true, sortOrder: true },
          },
          blueprintSlot: {
            columns: { id: true, slotNumber: true },
          },
        },
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
    pdfTemplateKey: paper.pdfTemplateKey,
    examYearLabel: paper.examYearLabel,
    timeAllowedLabel: paper.timeAllowedLabel,
    departmentLine: paper.departmentLine,
    answerInstructionLine: paper.answerInstructionLine,
    includeAnswerKey: paper.includeAnswerKey,
    status: paper.status,
    totalQuestions: paper.totalQuestions,
    totalMarks: paper.totalMarks,
    blueprint: paper.blueprint,
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
      blueprintOrigin:
        item.blueprintSection || item.blueprintSlot
          ? {
              section: item.blueprintSection
                ? {
                    id: item.blueprintSection.id,
                    code: item.blueprintSection.code,
                    title: item.blueprintSection.title,
                    sortOrder: item.blueprintSection.sortOrder,
                  }
                : null,
              slot: item.blueprintSlot
                ? {
                    id: item.blueprintSlot.id,
                    slotNumber: item.blueprintSlot.slotNumber,
                  }
                : null,
            }
          : null,
      position: item.position,
      questionCode: item.questionCode,
      questionType: item.questionType,
      marks: item.marks,
      swapCount: item.swapCount,
      swapLimit: item.swapLimit,
      swapsRemaining: Math.max(0, item.swapLimit - item.swapCount),
      body: item.renderedBody,
      questionImageUrls: toQuestionImageUrls(item.question?.questionImageUrls) ?? [],
      answerText: item.renderedAnswerText,
      solutionImageUrls: toQuestionImageUrls(item.question?.solutionImageUrls) ?? [],
      options: toRenderedOptions(item.renderedOptions),
    })),
  };
};
