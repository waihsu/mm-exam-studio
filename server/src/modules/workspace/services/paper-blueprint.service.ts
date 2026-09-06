import { and, eq, inArray } from "drizzle-orm";
import type { AppRole } from "@/core/types/app";
import {
  chapter,
  db,
  grade,
  gradeSubject,
  paperBlueprint,
  paperBlueprintSection,
  paperBlueprintSlot,
  question,
  subChapter,
  subject,
} from "@/db";
import {
  createPaperBlueprintSchema,
  type CreatePaperBlueprintInput,
  type MaterializePaperBlueprintInput,
  type PaperBlueprintDifficultyDistribution,
  type UpdatePaperBlueprintInput,
} from "../paper-blueprint.schema";
import { createQuestionPaper } from "./paper.service";
import { findPublishedQuestionIds } from "./workspace-catalog-shared.service";
import {
  allocationOrder,
  allocateDifficultyCounts,
  buildPresetExtraConditions,
  createPreviewIssue,
  dedupe,
  normalizePdfTemplateKey,
  normalizePresetConfig,
  normalizeTemplateConfig,
  summarizeGeneratedPaper,
  toQuestionDifficulty,
  type QuestionDifficultyBucket,
} from "./paper-blueprint.utils";
import {
  assertBlueprintMath,
  assertBlueprintReferences,
  replaceBlueprintChildren,
} from "./paper-blueprint.validation";
import { getUserWorkspaceAccess } from "../../subscriptions/subscription.core";

type BlueprintActor = {
  userId: string;
  roles: AppRole[];
};

type BlueprintRecord = Awaited<ReturnType<typeof loadAccessibleBlueprint>>;
const canAccessAllBlueprints = (actor: BlueprintActor) =>
  actor.roles.includes("superadmin");

const mapBlueprintToResponse = (blueprint: NonNullable<BlueprintRecord>) => ({
  id: blueprint.id,
  title: blueprint.title,
  mode: blueprint.mode,
  status: blueprint.status,
  totalMarks: blueprint.totalMarks,
  pdfTemplateKey: blueprint.pdfTemplateKey,
  examYearLabel: blueprint.examYearLabel,
  timeAllowedLabel: blueprint.timeAllowedLabel,
  departmentLine: blueprint.departmentLine,
  answerInstructionLine: blueprint.answerInstructionLine,
  includeAnswerPaper: blueprint.includeAnswerPaper,
  difficultyDistribution: blueprint.difficultyDistribution as {
    easy: number;
    normal: number;
    hard: number;
    advance: number;
  },
  presetConfig: normalizePresetConfig(blueprint.presetConfig),
  templateConfig: normalizeTemplateConfig(blueprint.templateConfig),
  createdAt: blueprint.createdAt,
  updatedAt: blueprint.updatedAt,
  generatedPaperCount: blueprint.generatedPapers.length,
  latestGeneratedPaper:
    blueprint.generatedPapers.length > 0
      ? summarizeGeneratedPaper(blueprint.generatedPapers[0])
      : null,
  owner: blueprint.user
    ? {
        id: blueprint.user.id,
        name: blueprint.user.name,
        email: blueprint.user.email,
      }
    : null,
  grade: blueprint.grade,
  subject: blueprint.subject,
  generatedPapers: blueprint.generatedPapers.map(summarizeGeneratedPaper),
  sections: blueprint.sections.map((section) => ({
    id: section.id,
    code: section.code,
    title: section.title,
    questionType: section.questionType,
    marksPerQuestion: section.marksPerQuestion,
    questionCount: section.questionCount,
    totalMarks: section.totalMarks,
    sortOrder: section.sortOrder,
  })),
  slots: blueprint.slots.map((slot) => ({
    id: slot.id,
    sectionId: slot.sectionId,
    sectionCode: slot.section?.code ?? null,
    slotNumber: slot.slotNumber,
    questionType: slot.questionType,
    marks: slot.marks,
    difficultyTarget: slot.difficultyTarget,
    chapterId: slot.chapterId,
    subChapterId: slot.subChapterId,
    swapLimit: slot.swapLimit,
    slotConfig: (slot.slotConfig as Record<string, unknown> | null) ?? null,
    chapter: slot.chapter
      ? {
          id: slot.chapter.id,
          code: slot.chapter.code,
          name: slot.chapter.name,
        }
      : null,
    subChapter: slot.subChapter
      ? {
          id: slot.subChapter.id,
          code: slot.subChapter.code,
          name: slot.subChapter.name,
        }
      : null,
    lockedQuestion: slot.lockedQuestion
      ? {
          id: slot.lockedQuestion.id,
          questionCode: slot.lockedQuestion.questionCode,
          type: slot.lockedQuestion.type,
          marks: slot.lockedQuestion.marks,
          title: slot.lockedQuestion.title,
        }
      : null,
    generatedQuestion: slot.generatedQuestion
      ? {
          id: slot.generatedQuestion.id,
          questionCode: slot.generatedQuestion.questionCode,
          type: slot.generatedQuestion.type,
          marks: slot.generatedQuestion.marks,
          title: slot.generatedQuestion.title,
        }
      : null,
  })),
});

const mapBlueprintToInputShape = (blueprint: NonNullable<BlueprintRecord>): CreatePaperBlueprintInput => ({
  title: blueprint.title,
  mode: blueprint.mode,
  status: blueprint.status,
  gradeId: blueprint.gradeId,
  subjectId: blueprint.subjectId,
  totalMarks: blueprint.totalMarks,
  pdfTemplateKey: normalizePdfTemplateKey(blueprint.pdfTemplateKey),
  examYearLabel: blueprint.examYearLabel ?? undefined,
  timeAllowedLabel: blueprint.timeAllowedLabel ?? undefined,
  departmentLine: blueprint.departmentLine ?? undefined,
  answerInstructionLine: blueprint.answerInstructionLine ?? undefined,
  includeAnswerPaper: blueprint.includeAnswerPaper,
  difficultyDistribution: blueprint.difficultyDistribution as {
    easy: number;
    normal: number;
    hard: number;
    advance: number;
  },
  presetConfig: normalizePresetConfig(blueprint.presetConfig),
  templateConfig: normalizeTemplateConfig(blueprint.templateConfig),
  sections: blueprint.sections.map((section) => ({
    code: section.code,
    title: section.title ?? undefined,
    questionType: section.questionType ?? undefined,
    marksPerQuestion: (section.marksPerQuestion as 1 | 2 | 3 | 5 | 10 | null) ?? undefined,
    questionCount: section.questionCount,
    totalMarks: section.totalMarks,
    sortOrder: section.sortOrder,
  })),
  slots: blueprint.slots.map((slot) => ({
    sectionCode: slot.section?.code ?? undefined,
    slotNumber: slot.slotNumber,
    questionType: slot.questionType,
    marks: slot.marks as 1 | 2 | 3 | 5 | 10,
    difficultyTarget: slot.difficultyTarget ?? undefined,
    chapterId: slot.chapterId ?? undefined,
    subChapterId: slot.subChapterId ?? undefined,
    lockedQuestionId: slot.lockedQuestionId ?? undefined,
    swapLimit: slot.swapLimit,
    slotConfig: (slot.slotConfig as Record<string, unknown> | null) ?? undefined,
  })),
});

const loadAccessibleBlueprint = async (actor: BlueprintActor, blueprintId: string) =>
  db.query.paperBlueprint.findFirst({
    where: canAccessAllBlueprints(actor)
      ? eq(paperBlueprint.id, blueprintId)
      : and(eq(paperBlueprint.id, blueprintId), eq(paperBlueprint.userId, actor.userId)),
    with: {
      user: {
        columns: { id: true, name: true, email: true },
      },
      grade: {
        columns: { id: true, code: true, name: true },
      },
      subject: {
        columns: { id: true, code: true, name: true },
      },
      generatedPapers: {
        orderBy: (table, { desc }) => [desc(table.updatedAt)],
        columns: {
          id: true,
          title: true,
          status: true,
          totalQuestions: true,
          totalMarks: true,
          exportedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      sections: {
        orderBy: (table, { asc }) => [asc(table.sortOrder), asc(table.code)],
      },
      slots: {
        orderBy: (table, { asc }) => [asc(table.slotNumber)],
        with: {
          section: {
            columns: { id: true, code: true, title: true },
          },
          chapter: {
            columns: { id: true, code: true, name: true },
          },
          subChapter: {
            columns: { id: true, code: true, name: true },
          },
          lockedQuestion: {
            columns: {
              id: true,
              questionCode: true,
              type: true,
              marks: true,
              title: true,
            },
          },
          generatedQuestion: {
            columns: {
              id: true,
              questionCode: true,
              type: true,
              marks: true,
              title: true,
            },
          },
        },
      },
    },
  });

const loadPublishedTemplateById = async (blueprintId: string) =>
  db.query.paperBlueprint.findFirst({
    where: eq(paperBlueprint.id, blueprintId),
    with: {
      user: {
        columns: { id: true, name: true, email: true },
      },
      grade: {
        columns: { id: true, code: true, name: true },
      },
      subject: {
        columns: { id: true, code: true, name: true },
      },
      generatedPapers: {
        orderBy: (table, { desc }) => [desc(table.updatedAt)],
        columns: {
          id: true,
          title: true,
          status: true,
          totalQuestions: true,
          totalMarks: true,
          exportedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      sections: {
        orderBy: (table, { asc }) => [asc(table.sortOrder), asc(table.code)],
      },
      slots: {
        orderBy: (table, { asc }) => [asc(table.slotNumber)],
        with: {
          section: {
            columns: { id: true, code: true, title: true },
          },
          chapter: {
            columns: { id: true, code: true, name: true },
          },
          subChapter: {
            columns: { id: true, code: true, name: true },
          },
          lockedQuestion: {
            columns: {
              id: true,
              questionCode: true,
              type: true,
              marks: true,
              title: true,
            },
          },
          generatedQuestion: {
            columns: {
              id: true,
              questionCode: true,
              type: true,
              marks: true,
              title: true,
            },
          },
        },
      },
    },
  });

export const listPaperBlueprints = async (actor: BlueprintActor) => {
  const rows = await db.query.paperBlueprint.findMany({
    where: canAccessAllBlueprints(actor)
      ? undefined
      : eq(paperBlueprint.userId, actor.userId),
    orderBy: (table, { desc }) => [desc(table.updatedAt)],
    with: {
      user: {
        columns: { id: true, name: true, email: true },
      },
      grade: {
        columns: { id: true, code: true, name: true },
      },
      subject: {
        columns: { id: true, code: true, name: true },
      },
      generatedPapers: {
        columns: {
          id: true,
          title: true,
          status: true,
          totalQuestions: true,
          totalMarks: true,
          exportedAt: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: (table, { desc }) => [desc(table.updatedAt)],
      },
      sections: {
        columns: { id: true },
      },
      slots: {
        columns: { id: true },
      },
    },
  });

  return {
    rows: rows.map((row) => ({
      id: row.id,
      title: row.title,
      mode: row.mode,
      status: row.status,
      totalMarks: row.totalMarks,
      pdfTemplateKey: row.pdfTemplateKey,
      examYearLabel: row.examYearLabel,
      timeAllowedLabel: row.timeAllowedLabel,
      departmentLine: row.departmentLine,
      answerInstructionLine: row.answerInstructionLine,
      includeAnswerPaper: row.includeAnswerPaper,
      templateConfig: normalizeTemplateConfig(row.templateConfig),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      generatedPaperCount: row.generatedPapers.length,
      latestGeneratedPaper:
        row.generatedPapers.length > 0
          ? summarizeGeneratedPaper(row.generatedPapers[0])
          : null,
      owner: row.user
        ? {
            id: row.user.id,
            name: row.user.name,
            email: row.user.email,
          }
        : null,
      sectionCount: row.sections.length,
      slotCount: row.slots.length,
      grade: row.grade,
      subject: row.subject,
    })),
  };
};

export const getPaperBlueprintDetail = async (actor: BlueprintActor, blueprintId: string) => {
  const blueprint = await loadAccessibleBlueprint(actor, blueprintId);
  if (!blueprint) {
    throw new Error("Paper blueprint not found.");
  }

  return mapBlueprintToResponse(blueprint);
};

export const listPublishedPaperTemplates = async (userId: string) => {
  const access = await getUserWorkspaceAccess(userId);
  const rows = await db.query.paperBlueprint.findMany({
    where: eq(paperBlueprint.status, "ready"),
    orderBy: (table, { desc }) => [desc(table.updatedAt)],
    with: {
      grade: {
        columns: { id: true, code: true, name: true },
      },
      subject: {
        columns: { id: true, code: true, name: true },
      },
      generatedPapers: {
        columns: {
          id: true,
          title: true,
          status: true,
          totalQuestions: true,
          totalMarks: true,
          exportedAt: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: (table, { desc }) => [desc(table.updatedAt)],
      },
      sections: {
        columns: { id: true },
      },
      slots: {
        columns: { id: true },
      },
    },
  });

  return {
    rows: rows
      .filter((row) => {
        const templateConfig = normalizeTemplateConfig(row.templateConfig);
        return (
          templateConfig.isPublished &&
          templateConfig.availablePlanCodes.includes(access.planCode)
        );
      })
      .map((row) => ({
        id: row.id,
        title: row.title,
        mode: row.mode,
        status: row.status,
        totalMarks: row.totalMarks,
        pdfTemplateKey: row.pdfTemplateKey,
        examYearLabel: row.examYearLabel,
        timeAllowedLabel: row.timeAllowedLabel,
        departmentLine: row.departmentLine,
        answerInstructionLine: row.answerInstructionLine,
        includeAnswerPaper: row.includeAnswerPaper,
        templateConfig: normalizeTemplateConfig(row.templateConfig),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        generatedPaperCount: row.generatedPapers.length,
        latestGeneratedPaper:
          row.generatedPapers.length > 0
            ? summarizeGeneratedPaper(row.generatedPapers[0])
            : null,
        sectionCount: row.sections.length,
        slotCount: row.slots.length,
        grade: row.grade,
        subject: row.subject,
      })),
    access: {
      planCode: access.planCode,
    },
  };
};

export const getPublishedPaperTemplateDetail = async (userId: string, blueprintId: string) => {
  const [blueprint, access] = await Promise.all([
    loadPublishedTemplateById(blueprintId),
    getUserWorkspaceAccess(userId),
  ]);

  if (!blueprint) {
    throw new Error("Template not found.");
  }

  const templateConfig = normalizeTemplateConfig(blueprint.templateConfig);
  if (!templateConfig.isPublished) {
    throw new Error("This blueprint is not published as a user template.");
  }

  if (!templateConfig.availablePlanCodes.includes(access.planCode)) {
    throw new Error("Your current plan cannot use this template.");
  }

  if (blueprint.status !== "ready") {
    throw new Error("This template is not ready yet.");
  }

  const presetConfig = normalizePresetConfig(blueprint.presetConfig);

  return {
    id: blueprint.id,
    title: blueprint.title,
    mode: blueprint.mode,
    status: blueprint.status,
    totalMarks: blueprint.totalMarks,
    includeAnswerPaper: blueprint.includeAnswerPaper,
    difficultyDistribution: blueprint.difficultyDistribution as {
      easy: number;
      normal: number;
      hard: number;
      advance: number;
    },
    templateConfig,
    presetConfig,
    createdAt: blueprint.createdAt,
    updatedAt: blueprint.updatedAt,
    generatedPaperCount: blueprint.generatedPapers.length,
    latestGeneratedPaper:
      blueprint.generatedPapers.length > 0
        ? summarizeGeneratedPaper(blueprint.generatedPapers[0])
        : null,
    sectionCount: blueprint.sections.length,
    slotCount: blueprint.slots.length,
    grade: blueprint.grade,
    subject: blueprint.subject,
    sections: blueprint.sections.map((section) => ({
      id: section.id,
      code: section.code,
      title: section.title,
      questionType: section.questionType,
      marksPerQuestion: section.marksPerQuestion,
      questionCount: section.questionCount,
      totalMarks: section.totalMarks,
      sortOrder: section.sortOrder,
    })),
    slots: blueprint.slots.map((slot) => ({
      id: slot.id,
      sectionId: slot.sectionId,
      sectionCode: slot.section?.code ?? null,
      slotNumber: slot.slotNumber,
      questionType: slot.questionType,
      marks: slot.marks,
      difficultyTarget: slot.difficultyTarget,
      chapterId: slot.chapterId,
      subChapterId: slot.subChapterId,
      swapLimit: slot.swapLimit,
      chapter: slot.chapter
        ? {
            id: slot.chapter.id,
            code: slot.chapter.code,
            name: slot.chapter.name,
          }
        : null,
      subChapter: slot.subChapter
        ? {
            id: slot.subChapter.id,
            code: slot.subChapter.code,
            name: slot.subChapter.name,
          }
        : null,
    })),
    access: {
      planCode: access.planCode,
    },
  };
};

const previewPresetSelection = async (params: {
  blueprint: NonNullable<BlueprintRecord>;
  selectedQuestionIds: string[];
  questionType: "mcq" | "true_false" | "short_answer" | "long_answer" | "fill_blank" | "matching";
  marks: 1 | 2 | 3 | 5 | 10;
  questionCount: number;
  overrides?: {
    chapterId?: string | null;
    subChapterId?: string | null;
  };
}) => {
  const presetConfig = normalizePresetConfig(params.blueprint.presetConfig);
  const allocation = allocateDifficultyCounts(
    params.questionCount,
    params.blueprint.difficultyDistribution as PaperBlueprintDifficultyDistribution,
  );
  const pickedIds: string[] = [];
  const bucketSummaries: Array<{
    difficulty: QuestionDifficultyBucket;
    requiredCount: number;
    matchedCount: number;
  }> = [];

  for (const bucket of allocationOrder) {
    const count = allocation[bucket];
    if (count < 1) continue;

    const difficulty = toQuestionDifficulty(bucket);
    const candidateIds = await findPublishedQuestionIds({
      filters: {
        gradeId: params.blueprint.gradeId,
        subjectId: params.blueprint.subjectId,
        questionType: params.questionType,
      },
      extraConditions: [
        eq(question.marks, params.marks),
        difficulty ? eq(question.difficulty, difficulty) : undefined,
        ...buildPresetExtraConditions(presetConfig, params.overrides),
      ],
      excludeIds: [...params.selectedQuestionIds, ...pickedIds],
      order: "stable",
      limit: count,
    });

    pickedIds.push(...candidateIds);
    bucketSummaries.push({
      difficulty: bucket,
      requiredCount: count,
      matchedCount: candidateIds.length,
    });
  }

  return {
    matchedIds: pickedIds,
    requestedCount: params.questionCount,
    matchedCount: pickedIds.length,
    enough: pickedIds.length === params.questionCount,
    buckets: bucketSummaries,
  };
};

export const getPaperBlueprintPreviewSummary = async (
  actor: BlueprintActor,
  blueprintId: string,
) => {
  const blueprint = await loadAccessibleBlueprint(actor, blueprintId);
  if (!blueprint) {
    throw new Error("Paper blueprint not found.");
  }

  const issues: Array<ReturnType<typeof createPreviewIssue>> = [];
  const reservedQuestionIds: string[] = [];

  if (blueprint.mode === "custom") {
    const slotSummaries = [];
    const orderedSlots = [...blueprint.slots].sort(
      (left, right) => left.slotNumber - right.slotNumber,
    );

    for (const slot of orderedSlots) {
      if (slot.lockedQuestionId) {
        const duplicated = reservedQuestionIds.includes(slot.lockedQuestionId);
        if (!duplicated) {
          reservedQuestionIds.push(slot.lockedQuestionId);
        } else {
          issues.push(
            createPreviewIssue({
              code: "locked_question_duplicate",
              message: `Slot ${slot.slotNumber} reuses a locked question that was already taken.`,
              sectionCode: slot.section?.code ?? null,
              slotNumber: slot.slotNumber,
              details: { lockedQuestionId: slot.lockedQuestionId },
            }),
          );
        }

        slotSummaries.push({
          slotNumber: slot.slotNumber,
          sectionCode: slot.section?.code ?? null,
          questionType: slot.questionType,
          marks: slot.marks,
          difficultyTarget: slot.difficultyTarget,
          matchedCount: duplicated ? 0 : 1,
          enough: !duplicated,
          lockedQuestionId: slot.lockedQuestionId,
        });
        continue;
      }

      const preview = await previewPresetSelection({
        blueprint,
        selectedQuestionIds: reservedQuestionIds,
        questionType: slot.questionType,
        marks: slot.marks as 1 | 2 | 3 | 5 | 10,
        questionCount: 1,
        overrides: {
          chapterId: slot.chapterId,
          subChapterId: slot.subChapterId,
        },
      });

      reservedQuestionIds.push(...preview.matchedIds);
      if (!preview.enough) {
        issues.push(
          createPreviewIssue({
            code: "slot_insufficient_matches",
            message: `Slot ${slot.slotNumber} does not have enough matching questions to materialize.`,
            sectionCode: slot.section?.code ?? null,
            slotNumber: slot.slotNumber,
            details: {
              matchedCount: preview.matchedCount,
              requestedCount: 1,
              questionType: slot.questionType,
              marks: slot.marks,
              difficultyTarget: slot.difficultyTarget ?? null,
            },
          }),
        );
      }

      slotSummaries.push({
        slotNumber: slot.slotNumber,
        sectionCode: slot.section?.code ?? null,
        questionType: slot.questionType,
        marks: slot.marks,
        difficultyTarget: slot.difficultyTarget,
        matchedCount: preview.matchedCount,
        enough: preview.enough,
        lockedQuestionId: null,
      });
    }

    return {
      blueprint: {
        id: blueprint.id,
        title: blueprint.title,
        mode: blueprint.mode,
        status: blueprint.status,
        totalMarks: blueprint.totalMarks,
      },
      readyToMaterialize: issues.length === 0,
      issueCount: issues.length,
      reservedQuestionCount: reservedQuestionIds.length,
      issues,
      sections: blueprint.sections.map((section) => ({
        code: section.code,
        title: section.title,
        questionType: section.questionType,
        marksPerQuestion: section.marksPerQuestion,
        questionCount: section.questionCount,
        totalMarks: section.totalMarks,
      })),
      slots: slotSummaries,
    };
  }

  const orderedSections = [...blueprint.sections].sort(
    (left, right) => left.sortOrder - right.sortOrder,
  );
  const sectionSummaries = [];

  if (blueprint.mode === "all_type" && orderedSections.length < 1) {
    issues.push(
      createPreviewIssue({
        code: "all_type_missing_sections",
        message: "All-type blueprints need at least one section.",
      }),
    );
  }

  if (blueprint.mode === "mcq_only" && orderedSections.length < 1) {
    const preview = await previewPresetSelection({
      blueprint,
      selectedQuestionIds: reservedQuestionIds,
      questionType: "mcq",
      marks: 1,
      questionCount: blueprint.totalMarks,
    });
    reservedQuestionIds.push(...preview.matchedIds);
    if (!preview.enough) {
      issues.push(
        createPreviewIssue({
          code: "mcq_only_insufficient_matches",
          message: "MCQ-only blueprint does not have enough 1-mark MCQs to materialize.",
          details: {
            matchedCount: preview.matchedCount,
            requestedCount: blueprint.totalMarks,
            questionType: "mcq",
            marks: 1,
          },
        }),
      );
    }
    sectionSummaries.push({
      code: "MCQ",
      title: "MCQ only",
      questionType: "mcq" as const,
      marksPerQuestion: 1,
      requestedCount: blueprint.totalMarks,
      matchedCount: preview.matchedCount,
      enough: preview.enough,
      buckets: preview.buckets,
    });
  } else {
    for (const section of orderedSections) {
      if (!section.questionType || typeof section.marksPerQuestion !== "number") {
        issues.push(
          createPreviewIssue({
            code: "section_missing_configuration",
            message: `Section ${section.code} is missing question type or marks per question.`,
            sectionCode: section.code,
          }),
        );
        sectionSummaries.push({
          code: section.code,
          title: section.title,
          questionType: section.questionType,
          marksPerQuestion: section.marksPerQuestion,
          requestedCount: section.questionCount,
          matchedCount: 0,
          enough: false,
          buckets: [],
        });
        continue;
      }

      const preview = await previewPresetSelection({
        blueprint,
        selectedQuestionIds: reservedQuestionIds,
        questionType: section.questionType,
        marks: section.marksPerQuestion as 1 | 2 | 3 | 5 | 10,
        questionCount: section.questionCount,
      });

      reservedQuestionIds.push(...preview.matchedIds);
      if (!preview.enough) {
        issues.push(
          createPreviewIssue({
            code: "section_insufficient_matches",
            message: `Section ${section.code} does not have enough matching questions.`,
            sectionCode: section.code,
            details: {
              matchedCount: preview.matchedCount,
              requestedCount: section.questionCount,
              questionType: section.questionType,
              marks: section.marksPerQuestion,
            },
          }),
        );
      }

      sectionSummaries.push({
        code: section.code,
        title: section.title,
        questionType: section.questionType,
        marksPerQuestion: section.marksPerQuestion,
        requestedCount: section.questionCount,
        matchedCount: preview.matchedCount,
        enough: preview.enough,
        buckets: preview.buckets,
      });
    }
  }

  return {
    blueprint: {
      id: blueprint.id,
      title: blueprint.title,
      mode: blueprint.mode,
      status: blueprint.status,
      totalMarks: blueprint.totalMarks,
    },
    readyToMaterialize: issues.length === 0,
    issueCount: issues.length,
    reservedQuestionCount: reservedQuestionIds.length,
    issues,
    sections: sectionSummaries,
    slots: [],
  };
};

export const createPaperBlueprint = async (
  userId: string,
  input: CreatePaperBlueprintInput,
) => {
  assertBlueprintMath(input);
  await assertBlueprintReferences(input);

  const [inserted] = await db
    .insert(paperBlueprint)
    .values({
      userId,
      title: input.title.trim(),
      mode: input.mode,
      status: input.status,
      gradeId: input.gradeId,
      subjectId: input.subjectId,
      totalMarks: input.totalMarks,
      pdfTemplateKey: input.pdfTemplateKey ?? "default",
      examYearLabel: input.examYearLabel?.trim() || null,
      timeAllowedLabel: input.timeAllowedLabel?.trim() || null,
      departmentLine: input.departmentLine?.trim() || null,
      answerInstructionLine: input.answerInstructionLine?.trim() || null,
      includeAnswerPaper: input.includeAnswerPaper ?? false,
      difficultyDistribution: input.difficultyDistribution,
      presetConfig: input.presetConfig ?? null,
      templateConfig: input.templateConfig ?? null,
    })
    .returning();

  await replaceBlueprintChildren(inserted.id, input.sections, input.slots);

  return getPaperBlueprintDetail({ userId, roles: ["admin"] }, inserted.id);
};

export const updatePaperBlueprint = async (
  actor: BlueprintActor,
  blueprintId: string,
  patch: UpdatePaperBlueprintInput,
) => {
  const existing = await loadAccessibleBlueprint(actor, blueprintId);
  if (!existing) {
    throw new Error("Paper blueprint not found.");
  }

  const merged = createPaperBlueprintSchema.parse({
    ...mapBlueprintToInputShape(existing),
    ...patch,
    includeAnswerPaper:
      patch.includeAnswerPaper ?? mapBlueprintToInputShape(existing).includeAnswerPaper,
    presetConfig:
      patch.presetConfig === undefined
        ? mapBlueprintToInputShape(existing).presetConfig
        : patch.presetConfig,
    templateConfig:
      patch.templateConfig === undefined
        ? mapBlueprintToInputShape(existing).templateConfig
        : patch.templateConfig,
    sections: patch.sections ?? mapBlueprintToInputShape(existing).sections,
    slots: patch.slots ?? mapBlueprintToInputShape(existing).slots,
  });

  assertBlueprintMath(merged);
  await assertBlueprintReferences(merged);

  await db
    .update(paperBlueprint)
    .set({
      title: merged.title.trim(),
      mode: merged.mode,
      status: merged.status,
      gradeId: merged.gradeId,
      subjectId: merged.subjectId,
      totalMarks: merged.totalMarks,
      pdfTemplateKey: merged.pdfTemplateKey ?? "default",
      examYearLabel: merged.examYearLabel?.trim() || null,
      timeAllowedLabel: merged.timeAllowedLabel?.trim() || null,
      departmentLine: merged.departmentLine?.trim() || null,
      answerInstructionLine: merged.answerInstructionLine?.trim() || null,
      includeAnswerPaper: merged.includeAnswerPaper ?? false,
      difficultyDistribution: merged.difficultyDistribution,
      presetConfig: merged.presetConfig ?? null,
      templateConfig: merged.templateConfig ?? null,
      updatedAt: new Date(),
    })
    .where(eq(paperBlueprint.id, blueprintId));

  await replaceBlueprintChildren(blueprintId, merged.sections, merged.slots);

  return getPaperBlueprintDetail(actor, blueprintId);
};

export const deletePaperBlueprint = async (actor: BlueprintActor, blueprintId: string) => {
  const existing = await loadAccessibleBlueprint(actor, blueprintId);

  if (!existing) {
    throw new Error("Paper blueprint not found.");
  }

  await db.delete(paperBlueprint).where(eq(paperBlueprint.id, existing.id));

  return {
    success: true as const,
    id: existing.id,
  };
};

const resolveMaterializedPaperTitle = (
  blueprintTitle: string,
  input: MaterializePaperBlueprintInput,
) => input.title?.trim() || blueprintTitle;

const resolveMaterializeCommonFields = (
  blueprint: NonNullable<BlueprintRecord>,
  input: MaterializePaperBlueprintInput,
) => ({
  title: resolveMaterializedPaperTitle(blueprint.title, input),
  instructions: input.instructions?.trim() || undefined,
  schoolName: input.schoolName?.trim() || undefined,
  academicYear: input.academicYear?.trim() || undefined,
  pdfTemplateKey: input.pdfTemplateKey ?? normalizePdfTemplateKey(blueprint.pdfTemplateKey),
  examYearLabel: input.examYearLabel?.trim() || blueprint.examYearLabel || undefined,
  timeAllowedLabel: input.timeAllowedLabel?.trim() || blueprint.timeAllowedLabel || undefined,
  departmentLine: input.departmentLine?.trim() || blueprint.departmentLine || undefined,
  answerInstructionLine:
    input.answerInstructionLine?.trim() || blueprint.answerInstructionLine || undefined,
  brandAssetId: input.brandAssetId,
  includeAnswerKey: blueprint.includeAnswerPaper,
  gradeId: blueprint.gradeId,
  subjectId: blueprint.subjectId,
  blueprintId: blueprint.id,
});

const markBlueprintReady = async (blueprintId: string) => {
  await db
    .update(paperBlueprint)
    .set({
      status: "ready",
      updatedAt: new Date(),
    })
    .where(eq(paperBlueprint.id, blueprintId));
};

const storeGeneratedSlotQuestionIds = async (
  blueprintId: string,
  generatedBySlotNumber: Map<number, string>,
) => {
  const slots = await db.query.paperBlueprintSlot.findMany({
    where: eq(paperBlueprintSlot.blueprintId, blueprintId),
    columns: {
      id: true,
      slotNumber: true,
    },
  });

  for (const slot of slots) {
    await db
      .update(paperBlueprintSlot)
      .set({
        generatedQuestionId: generatedBySlotNumber.get(slot.slotNumber) ?? null,
        updatedAt: new Date(),
      })
      .where(eq(paperBlueprintSlot.id, slot.id));
  }
};

const selectQuestionIdsForPresetSection = async (params: {
  blueprint: NonNullable<BlueprintRecord>;
  selectedQuestionIds: string[];
  questionType: "mcq" | "true_false" | "short_answer" | "long_answer" | "fill_blank" | "matching";
  marks: 1 | 2 | 3 | 5 | 10;
  questionCount: number;
  overrides?: {
    chapterId?: string | null;
    subChapterId?: string | null;
  };
}) => {
  const presetConfig = normalizePresetConfig(params.blueprint.presetConfig);
  const allocation = allocateDifficultyCounts(
    params.questionCount,
    params.blueprint.difficultyDistribution as PaperBlueprintDifficultyDistribution,
  );
  const pickedIds: string[] = [];

  for (const bucket of allocationOrder) {
    const count = allocation[bucket];
    if (count < 1) continue;

    const difficulty = toQuestionDifficulty(bucket);
    const candidateIds = await findPublishedQuestionIds({
      filters: {
        gradeId: params.blueprint.gradeId,
        subjectId: params.blueprint.subjectId,
        questionType: params.questionType,
      },
      extraConditions: [
        eq(question.marks, params.marks),
        difficulty ? eq(question.difficulty, difficulty) : undefined,
        ...buildPresetExtraConditions(presetConfig, params.overrides),
      ],
      excludeIds: [...params.selectedQuestionIds, ...pickedIds],
      order: "stable",
      limit: count,
    });

    if (candidateIds.length !== count) {
      throw new Error(
        `Not enough ${params.questionType} questions matched the preset blueprint for ${bucket} difficulty.`,
      );
    }

    pickedIds.push(...candidateIds);
  }

  return pickedIds;
};

const materializeCustomBlueprint = async (
  blueprint: NonNullable<BlueprintRecord>,
  input: MaterializePaperBlueprintInput,
  userId: string,
  options: {
    persistGeneratedSlots: boolean;
    markReady: boolean;
  },
) => {
  if (blueprint.slots.length < 1) {
    throw new Error("Add at least one slot before generating a paper from this blueprint.");
  }

  const orderedSlots = [...blueprint.slots].sort(
    (left, right) => left.slotNumber - right.slotNumber,
  );
  const selectedQuestionIds: string[] = [];
  const generatedBySlotNumber = new Map<number, string>();
  const itemSourcesByQuestionId: Record<
    string,
    {
      blueprintSectionId?: string | null;
      blueprintSlotId?: string | null;
    }
  > = {};

  for (const slot of orderedSlots) {
    if (slot.lockedQuestionId) {
      if (selectedQuestionIds.includes(slot.lockedQuestionId)) {
        throw new Error(
          `Locked question reused in slot ${slot.slotNumber}. Each slot needs a distinct question.`,
        );
      }
      selectedQuestionIds.push(slot.lockedQuestionId);
      generatedBySlotNumber.set(slot.slotNumber, slot.lockedQuestionId);
      itemSourcesByQuestionId[slot.lockedQuestionId] = {
        blueprintSectionId: slot.sectionId ?? null,
        blueprintSlotId: slot.id,
      };
      continue;
    }

    const difficulty = toQuestionDifficulty(slot.difficultyTarget);
    const candidateIds = await findPublishedQuestionIds({
      filters: {
        gradeId: blueprint.gradeId,
        subjectId: blueprint.subjectId,
        chapterId: slot.chapterId ?? undefined,
        subChapterId: slot.subChapterId ?? undefined,
        questionType: slot.questionType,
      },
      extraConditions: [
        eq(question.marks, slot.marks),
        difficulty ? eq(question.difficulty, difficulty) : undefined,
      ],
      excludeIds: selectedQuestionIds,
      order: "stable",
      limit: 1,
    });

    const candidateId = candidateIds[0];
    if (!candidateId) {
      throw new Error(
        `No published question matched slot ${slot.slotNumber}. Adjust chapter, difficulty, or marks.`,
      );
    }

    selectedQuestionIds.push(candidateId);
    generatedBySlotNumber.set(slot.slotNumber, candidateId);
    itemSourcesByQuestionId[candidateId] = {
      blueprintSectionId: slot.sectionId ?? null,
      blueprintSlotId: slot.id,
    };
  }

  const paper = await createQuestionPaper(userId, {
    ...resolveMaterializeCommonFields(blueprint, input),
    questionIds: selectedQuestionIds,
    itemSourcesByQuestionId,
    generatorMode: "all_questions",
  });

  if (options.persistGeneratedSlots) {
    await storeGeneratedSlotQuestionIds(blueprint.id, generatedBySlotNumber);
  }
  if (options.markReady) {
    await markBlueprintReady(blueprint.id);
  }

  return paper;
};

const materializeMcqOnlyBlueprint = async (
  blueprint: NonNullable<BlueprintRecord>,
  input: MaterializePaperBlueprintInput,
  userId: string,
  options: {
    markReady: boolean;
  },
) => {
  if (
    blueprint.sections.some(
      (section) =>
        (section.questionType && section.questionType !== "mcq") ||
        (typeof section.marksPerQuestion === "number" && section.marksPerQuestion !== 1),
    )
  ) {
    throw new Error("MCQ-only blueprints can only contain 1-mark MCQ sections.");
  }

  const questionCount =
    blueprint.sections.length > 0
      ? blueprint.sections.reduce((sum, section) => sum + section.questionCount, 0)
      : blueprint.totalMarks;

  if (questionCount < 1) {
    throw new Error("MCQ-only blueprint needs at least one question.");
  }

  const questionIds = await selectQuestionIdsForPresetSection({
    blueprint,
    selectedQuestionIds: [],
    questionType: "mcq",
    marks: 1,
    questionCount,
  });
  const itemSourcesByQuestionId: Record<
    string,
    {
      blueprintSectionId?: string | null;
      blueprintSlotId?: string | null;
    }
  > = {};
  const orderedSections = [...blueprint.sections].sort(
    (left, right) => left.sortOrder - right.sortOrder,
  );
  if (orderedSections.length === 1) {
    for (const questionId of questionIds) {
      itemSourcesByQuestionId[questionId] = {
        blueprintSectionId: orderedSections[0]?.id ?? null,
        blueprintSlotId: null,
      };
    }
  }

  const paper = await createQuestionPaper(userId, {
    ...resolveMaterializeCommonFields(blueprint, input),
    questionIds,
    itemSourcesByQuestionId,
    generatorMode: "all_questions",
  });

  if (options.markReady) {
    await markBlueprintReady(blueprint.id);
  }

  return paper;
};

const materializeAllTypeBlueprint = async (
  blueprint: NonNullable<BlueprintRecord>,
  input: MaterializePaperBlueprintInput,
  userId: string,
  options: {
    markReady: boolean;
  },
) => {
  if (blueprint.sections.length < 1) {
    throw new Error("All-type blueprints need at least one section.");
  }

  const selectedQuestionIds: string[] = [];
  const itemSourcesByQuestionId: Record<
    string,
    {
      blueprintSectionId?: string | null;
      blueprintSlotId?: string | null;
    }
  > = {};
  const sections = [...blueprint.sections].sort((left, right) => left.sortOrder - right.sortOrder);

  for (const section of sections) {
    if (!section.questionType) {
      throw new Error(`Section ${section.code} needs a question type before generation.`);
    }
    if (typeof section.marksPerQuestion !== "number") {
      throw new Error(`Section ${section.code} needs marks per question before generation.`);
    }

    const sectionIds = await selectQuestionIdsForPresetSection({
      blueprint,
      selectedQuestionIds,
      questionType: section.questionType,
      marks: section.marksPerQuestion as 1 | 2 | 3 | 5 | 10,
      questionCount: section.questionCount,
    });
    for (const questionId of sectionIds) {
      itemSourcesByQuestionId[questionId] = {
        blueprintSectionId: section.id,
        blueprintSlotId: null,
      };
    }
    selectedQuestionIds.push(...sectionIds);
  }

  const paper = await createQuestionPaper(userId, {
    ...resolveMaterializeCommonFields(blueprint, input),
    questionIds: selectedQuestionIds,
    itemSourcesByQuestionId,
    generatorMode: "all_questions",
  });

  if (options.markReady) {
    await markBlueprintReady(blueprint.id);
  }

  return paper;
};

export const materializePaperBlueprint = async (
  actor: BlueprintActor,
  blueprintId: string,
  input: MaterializePaperBlueprintInput,
) => {
  const blueprint = await loadAccessibleBlueprint(actor, blueprintId);
  if (!blueprint) {
    throw new Error("Paper blueprint not found.");
  }

  if (blueprint.status === "archived") {
    throw new Error("Archived blueprints cannot generate papers.");
  }

  if (blueprint.mode === "custom") {
    return materializeCustomBlueprint(blueprint, input, actor.userId, {
      persistGeneratedSlots: true,
      markReady: true,
    });
  }

  if (blueprint.mode === "mcq_only") {
    return materializeMcqOnlyBlueprint(blueprint, input, actor.userId, {
      markReady: true,
    });
  }

  return materializeAllTypeBlueprint(blueprint, input, actor.userId, {
    markReady: true,
  });
};

export const materializePublishedPaperTemplate = async (
  userId: string,
  blueprintId: string,
  input: MaterializePaperBlueprintInput,
) => {
  const [blueprint, access] = await Promise.all([
    loadPublishedTemplateById(blueprintId),
    getUserWorkspaceAccess(userId),
  ]);

  if (!blueprint) {
    throw new Error("Template not found.");
  }

  const templateConfig = normalizeTemplateConfig(blueprint.templateConfig);
  if (!templateConfig.isPublished) {
    throw new Error("This blueprint is not published as a user template.");
  }

  if (!templateConfig.availablePlanCodes.includes(access.planCode)) {
    throw new Error("Your current plan cannot use this template.");
  }

  if (blueprint.status !== "ready") {
    throw new Error("This template is not ready yet.");
  }

  if (blueprint.mode === "custom") {
    return materializeCustomBlueprint(blueprint, input, userId, {
      persistGeneratedSlots: false,
      markReady: false,
    });
  }

  if (blueprint.mode === "mcq_only") {
    return materializeMcqOnlyBlueprint(blueprint, input, userId, {
      markReady: false,
    });
  }

  return materializeAllTypeBlueprint(blueprint, input, userId, {
    markReady: false,
  });
};
