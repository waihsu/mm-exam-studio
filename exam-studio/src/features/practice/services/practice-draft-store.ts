import * as SecureStore from "expo-secure-store";

const STORE_PREFIX = "practice_draft_v1_";
const DRAFT_INDEX_KEY = "practice_draft_index_v1";

const sanitizeKeyPart = (value: string) =>
  Array.from(value)
    .map((char) =>
      /^[A-Za-z0-9._-]$/.test(char)
        ? char
        : `_${char.codePointAt(0)?.toString(16) ?? "0"}_`,
    )
    .join("");

const toKey = (sessionId: string) => `${STORE_PREFIX}${sanitizeKeyPart(sessionId.trim())}`;
const normalizeSessionId = (sessionId: string) => sessionId.trim();

const loadDraftIndex = async () => {
  const raw = await SecureStore.getItemAsync(DRAFT_INDEX_KEY);
  if (!raw?.trim()) {
    return [] as string[];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [] as string[];
    }
    return Array.from(
      new Set(
        parsed
          .filter((value): value is string => typeof value === "string")
          .map((value) => value.trim())
          .filter((value) => value.length > 0),
      ),
    );
  } catch {
    return [] as string[];
  }
};

const saveDraftIndex = async (sessionIds: string[]) => {
  await SecureStore.setItemAsync(DRAFT_INDEX_KEY, JSON.stringify(sessionIds));
};

export const loadPracticeDraft = async (sessionId: string) => {
  const key = toKey(sessionId);
  const raw = await SecureStore.getItemAsync(key);
  if (!raw?.trim()) {
    return {} as Record<string, string>;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {} as Record<string, string>;
    }

    return Object.entries(parsed).reduce<Record<string, string>>((next, [itemId, answer]) => {
      if (typeof answer !== "string") return next;
      const normalizedItemId = itemId.trim();
      if (!normalizedItemId) return next;
      next[normalizedItemId] = answer;
      return next;
    }, {});
  } catch {
    return {} as Record<string, string>;
  }
};

export const savePracticeDraft = async (sessionId: string, answers: Record<string, string>) => {
  const normalizedSessionId = normalizeSessionId(sessionId);
  if (!normalizedSessionId) {
    return;
  }

  const key = toKey(normalizedSessionId);
  const sanitized = Object.entries(answers).reduce<Record<string, string>>((next, [itemId, value]) => {
    const normalizedItemId = itemId.trim();
    if (!normalizedItemId) return next;
    next[normalizedItemId] = String(value ?? "");
    return next;
  }, {});

  await SecureStore.setItemAsync(key, JSON.stringify(sanitized));
  const currentIndex = await loadDraftIndex();
  if (!currentIndex.includes(normalizedSessionId)) {
    await saveDraftIndex([...currentIndex, normalizedSessionId]);
  }
};

export const clearPracticeDraft = async (sessionId: string) => {
  const normalizedSessionId = normalizeSessionId(sessionId);
  if (!normalizedSessionId) {
    return;
  }

  await SecureStore.deleteItemAsync(toKey(normalizedSessionId));
  const currentIndex = await loadDraftIndex();
  if (currentIndex.length === 0) {
    return;
  }
  const nextIndex = currentIndex.filter((id) => id !== normalizedSessionId);
  await saveDraftIndex(nextIndex);
};

export const clearAllPracticeDrafts = async () => {
  const sessionIds = await loadDraftIndex();
  await Promise.all(sessionIds.map((sessionId) => SecureStore.deleteItemAsync(toKey(sessionId))));
  await SecureStore.deleteItemAsync(DRAFT_INDEX_KEY);
};

export const getStoredPracticeDraftCount = async () => {
  const sessionIds = await loadDraftIndex();
  return sessionIds.length;
};
