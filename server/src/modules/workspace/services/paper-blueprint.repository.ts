import { and, eq } from "drizzle-orm";
import type { AppRole } from "@/core/types/app";
import { db, paperBlueprint } from "@/db";

export type BlueprintActor = {
  userId: string;
  roles: AppRole[];
};

export const canAccessAllBlueprints = (actor: BlueprintActor) =>
  actor.roles.includes("superadmin");

export const loadAccessibleBlueprint = async (actor: BlueprintActor, blueprintId: string) =>
  db.query.paperBlueprint.findFirst({
    where: canAccessAllBlueprints(actor)
      ? eq(paperBlueprint.id, blueprintId)
      : and(eq(paperBlueprint.id, blueprintId), eq(paperBlueprint.userId, actor.userId)),
    with: {
      user: { columns: { id: true, name: true, email: true } },
      grade: { columns: { id: true, code: true, name: true } },
      subject: { columns: { id: true, code: true, name: true } },
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
      sections: { orderBy: (table, { asc }) => [asc(table.sortOrder), asc(table.code)] },
      slots: {
        orderBy: (table, { asc }) => [asc(table.slotNumber)],
        with: {
          section: { columns: { id: true, code: true, title: true } },
          chapter: { columns: { id: true, code: true, name: true } },
          subChapter: { columns: { id: true, code: true, name: true } },
          lockedQuestion: {
            columns: { id: true, questionCode: true, type: true, marks: true, title: true },
          },
          generatedQuestion: {
            columns: { id: true, questionCode: true, type: true, marks: true, title: true },
          },
        },
      },
    },
  });

export type BlueprintRecord = Awaited<ReturnType<typeof loadAccessibleBlueprint>>;

export const loadPublishedTemplateById = async (blueprintId: string) =>
  db.query.paperBlueprint.findFirst({
    where: eq(paperBlueprint.id, blueprintId),
    with: {
      user: { columns: { id: true, name: true, email: true } },
      grade: { columns: { id: true, code: true, name: true } },
      subject: { columns: { id: true, code: true, name: true } },
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
      sections: { orderBy: (table, { asc }) => [asc(table.sortOrder), asc(table.code)] },
      slots: {
        orderBy: (table, { asc }) => [asc(table.slotNumber)],
        with: {
          section: { columns: { id: true, code: true, title: true } },
          chapter: { columns: { id: true, code: true, name: true } },
          subChapter: { columns: { id: true, code: true, name: true } },
          lockedQuestion: {
            columns: { id: true, questionCode: true, type: true, marks: true, title: true },
          },
          generatedQuestion: {
            columns: { id: true, questionCode: true, type: true, marks: true, title: true },
          },
        },
      },
    },
  });
