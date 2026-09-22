import { and, eq } from "drizzle-orm";
import { db, practiceSession, practiceSessionItem } from "@/db";
import { gradePracticeSessionAnswers } from "../utils/practice-answer-grading";
import type { SubmitPracticeSessionInput } from "../workspace.schema";
import { getPracticeSessionDetail } from "./practice-detail.service";

export const submitPracticeSession = async (
  userId: string,
  sessionId: string,
  input: SubmitPracticeSessionInput,
) => {
  const session = await db.query.practiceSession.findFirst({
    where: and(eq(practiceSession.id, sessionId), eq(practiceSession.userId, userId)),
    with: {
      items: {
        orderBy: (table, { asc }) => [asc(table.position)],
      },
    },
  });

  if (!session) {
    throw new Error("Practice session not found.");
  }

  if (session.status === "completed") {
    throw new Error("This practice session has already been submitted.");
  }

  const grading = gradePracticeSessionAnswers({
    items: session.items,
    answers: input.answers,
  });
  const gradedItems = grading.items.map((item) => ({
    ...item,
    answeredAt: new Date(),
  }));

  for (const item of gradedItems) {
    await db
      .update(practiceSessionItem)
      .set({
        submittedAnswer: item.submittedAnswer,
        isCorrect: item.isCorrect,
        answeredAt: item.answeredAt,
      })
      .where(eq(practiceSessionItem.id, item.id));
  }

  await db
    .update(practiceSession)
    .set({
      status: "completed",
      correctAnswers: grading.correctAnswers,
      scorePercent: grading.scorePercent,
      completedAt: new Date(),
    })
    .where(eq(practiceSession.id, session.id));

  return getPracticeSessionDetail(userId, sessionId);
};

