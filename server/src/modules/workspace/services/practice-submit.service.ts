import { and, eq } from "drizzle-orm";
import { db, practiceSession, practiceSessionItem } from "@/db";
import {
  canonicalizeMatchingPairs,
  normalizeAnswer,
  parseMatchingAnswer,
} from "../utils/matching-answer";
import { toRenderedOptions } from "../workspace.mapper";
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

  const answerMap = new Map(
    input.answers.map((entry) => [entry.itemId, entry.answer?.trim() ?? ""]),
  );

  const gradedItems = session.items.map((item) => {
    const submittedAnswer = answerMap.get(item.id) ?? "";
    const renderedOptions = toRenderedOptions(item.renderedOptions);
    let isCorrect = false;

    if (item.questionType === "matching") {
      const expectedPairs = renderedOptions.reduce<Record<string, string>>((pairs, option, index) => {
        const left = option.label?.trim() || `Item ${index + 1}`;
        const right = option.text.trim();
        if (!left || !right) return pairs;
        pairs[left] = right;
        return pairs;
      }, {});

      const expected = canonicalizeMatchingPairs(expectedPairs);
      const submitted = canonicalizeMatchingPairs(parseMatchingAnswer(submittedAnswer));
      isCorrect = expected.length > 0 && expected === submitted;
    } else {
      const correctValues = [
        ...renderedOptions
          .filter((option) => option.isCorrect)
          .map((option) => option.label?.trim() || option.text.trim()),
        ...(item.renderedAnswerText ? [item.renderedAnswerText] : []),
      ].filter(Boolean);

      isCorrect = correctValues.some(
        (value) => normalizeAnswer(value) === normalizeAnswer(submittedAnswer),
      );
    }

    return {
      id: item.id,
      submittedAnswer: submittedAnswer || null,
      isCorrect,
      answeredAt: new Date(),
    };
  });

  const correctAnswers = gradedItems.filter((item) => item.isCorrect).length;
  const scorePercent =
    session.totalQuestions > 0
      ? Number(((correctAnswers / session.totalQuestions) * 100).toFixed(2))
      : 0;

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
      correctAnswers,
      scorePercent,
      completedAt: new Date(),
    })
    .where(eq(practiceSession.id, session.id));

  return getPracticeSessionDetail(userId, sessionId);
};

