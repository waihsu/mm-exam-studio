import { and, eq } from "drizzle-orm";
import { db, practiceSession } from "@/db";
import { mapPracticeItemForClient } from "../workspace.mapper";

export const listPracticeSessions = async (userId: string) => {
  const rows = await db.query.practiceSession.findMany({
    where: eq(practiceSession.userId, userId),
    orderBy: (table, { desc }) => [desc(table.createdAt)],
    limit: 12,
    columns: {
      id: true,
      title: true,
      status: true,
      totalQuestions: true,
      correctAnswers: true,
      scorePercent: true,
      startedAt: true,
      completedAt: true,
    },
    with: {
      grade: {
        columns: { id: true, name: true, code: true },
      },
      subject: {
        columns: { id: true, name: true, code: true },
      },
    },
  });

  return { rows };
};

export const getPracticeSessionDetail = async (userId: string, sessionId: string) => {
  const session = await db.query.practiceSession.findFirst({
    where: and(eq(practiceSession.id, sessionId), eq(practiceSession.userId, userId)),
    with: {
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

  if (!session) {
    throw new Error("Practice session not found.");
  }

  const revealAnswers = session.status === "completed";

  return {
    id: session.id,
    title: session.title,
    status: session.status,
    totalQuestions: session.totalQuestions,
    correctAnswers: session.correctAnswers,
    scorePercent: session.scorePercent,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    grade: session.grade,
    subject: session.subject,
    chapter: session.chapter,
    subChapter: session.subChapter,
    items: session.items.map((item) => mapPracticeItemForClient(item, revealAnswers)),
  };
};

