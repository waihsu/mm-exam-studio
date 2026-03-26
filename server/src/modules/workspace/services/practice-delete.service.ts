import { and, eq } from "drizzle-orm";
import { db, practiceSession } from "@/db";

export const deletePracticeSession = async (userId: string, sessionId: string) => {
  const [deletedSession] = await db
    .delete(practiceSession)
    .where(and(eq(practiceSession.id, sessionId), eq(practiceSession.userId, userId)))
    .returning();

  if (!deletedSession) {
    throw new Error("Practice session not found.");
  }

  return {
    id: deletedSession.id,
  };
};
