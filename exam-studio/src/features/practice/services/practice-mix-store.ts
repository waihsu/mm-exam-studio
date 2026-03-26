import * as SecureStore from "expo-secure-store";
import type { PracticeQuestionType } from "../types/practice.types";

const PRACTICE_MIX_KEY = "exam_studio_practice_mix_v1";

export type StoredPracticeMix = Record<PracticeQuestionType, string>;

const DEFAULT_PRACTICE_MIX: StoredPracticeMix = {
  mcq: "0",
  true_false: "0",
  short_answer: "0",
  long_answer: "0",
  fill_blank: "0",
  matching: "0",
};

const toStoredPracticeMix = (value: unknown): StoredPracticeMix => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ...DEFAULT_PRACTICE_MIX };
  }

  const record = value as Record<string, unknown>;
  return {
    mcq: typeof record.mcq === "string" ? record.mcq : "0",
    true_false: typeof record.true_false === "string" ? record.true_false : "0",
    short_answer: typeof record.short_answer === "string" ? record.short_answer : "0",
    long_answer: typeof record.long_answer === "string" ? record.long_answer : "0",
    fill_blank: typeof record.fill_blank === "string" ? record.fill_blank : "0",
    matching: typeof record.matching === "string" ? record.matching : "0",
  };
};

export const getStoredPracticeMix = async (): Promise<StoredPracticeMix> => {
  try {
    const raw = await SecureStore.getItemAsync(PRACTICE_MIX_KEY);
    if (!raw?.trim()) {
      return { ...DEFAULT_PRACTICE_MIX };
    }

    return toStoredPracticeMix(JSON.parse(raw) as unknown);
  } catch {
    return { ...DEFAULT_PRACTICE_MIX };
  }
};

export const saveStoredPracticeMix = async (mix: StoredPracticeMix) => {
  try {
    await SecureStore.setItemAsync(PRACTICE_MIX_KEY, JSON.stringify(toStoredPracticeMix(mix)));
  } catch {
    // Ignore persistence failures so practice generation still works.
  }
};

export const getDefaultPracticeMix = () => ({ ...DEFAULT_PRACTICE_MIX });

