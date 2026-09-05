import { useCallback, useEffect, useState } from "react";

type PracticeDraft = Record<string, string>;

const storageKeyFor = (sessionId: string) =>
  `mm-exam-studio:practice-session:${sessionId}:draft`;

const readDraft = (sessionId: string): PracticeDraft => {
  if (typeof window === "undefined") return {};

  try {
    const saved = window.sessionStorage.getItem(storageKeyFor(sessionId));
    if (!saved) return {};

    const parsed: unknown = JSON.parse(saved);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([key, value]) => typeof key === "string" && typeof value === "string"
      )
    );
  } catch {
    return {};
  }
};

/**
 * Keeps an in-progress answer set safe across reloads in the current browser.
 * Submitted answers remain server-owned; this is only an unsent learner draft.
 */
export function usePracticeSessionDraft(
  sessionId: string,
  isCompleted: boolean
) {
  const [answers, setAnswers] = useState<PracticeDraft>({});
  const [hydratedSessionId, setHydratedSessionId] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (isCompleted) {
      setAnswers({});
      setHydratedSessionId(sessionId);
      return;
    }

    setAnswers(readDraft(sessionId));
    setHydratedSessionId(sessionId);
  }, [isCompleted, sessionId]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      isCompleted ||
      hydratedSessionId !== sessionId
    ) {
      return;
    }

    try {
      window.sessionStorage.setItem(storageKeyFor(sessionId), JSON.stringify(answers));
    } catch {
      // Storage can be unavailable in private or restricted browser contexts.
    }
  }, [answers, hydratedSessionId, isCompleted, sessionId]);

  const clearDraft = useCallback(() => {
    setAnswers({});
    if (typeof window === "undefined") return;

    try {
      window.sessionStorage.removeItem(storageKeyFor(sessionId));
    } catch {
      // The session can still be submitted when browser storage is unavailable.
    }
  }, [sessionId]);

  return { answers, setAnswers, clearDraft };
}
