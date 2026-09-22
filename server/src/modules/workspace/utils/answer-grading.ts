import { normalizeAnswer } from "./matching-answer";

const stripOuterMathDelimiters = (value: string) => {
  if (value.startsWith("$$") && value.endsWith("$$")) {
    return value.slice(2, -2).trim();
  }
  if (value.startsWith("$") && value.endsWith("$")) {
    return value.slice(1, -1).trim();
  }
  return value;
};

const normalizeComparableAnswer = (value: string | null | undefined) =>
  normalizeAnswer(stripOuterMathDelimiters(String(value ?? "").trim()));

export const isLiteralAnswerEquivalent = (
  expectedValue: string | null | undefined,
  submittedValue: string | null | undefined,
) => {
  const expected = normalizeComparableAnswer(expectedValue);
  const submitted = normalizeComparableAnswer(submittedValue);
  return Boolean(expected && submitted && expected === submitted);
};

const parseSimpleAssignment = (value: string) => {
  const match = value.match(/^([a-z][a-z0-9_]*)\s*=\s*(.+)$/i);
  return match
    ? { variable: match[1]!.toLowerCase(), expression: match[2]!.trim() }
    : null;
};

/**
 * Compares a short answer without pretending to solve arbitrary mathematics.
 * A keyed answer such as `x = 12` accepts a learner's concise `12`, while a
 * different variable assignment such as `y = 12` remains incorrect.
 */
export const isShortAnswerEquivalent = (
  expectedValue: string | null | undefined,
  submittedValue: string | null | undefined,
) => {
  const expected = normalizeComparableAnswer(expectedValue);
  const submitted = normalizeComparableAnswer(submittedValue);

  if (!expected || !submitted) return false;
  if (isLiteralAnswerEquivalent(expected, submitted)) return true;

  const expectedAssignment = parseSimpleAssignment(expected);
  const submittedAssignment = parseSimpleAssignment(submitted);

  if (!expectedAssignment) return false;
  if (!submittedAssignment) {
    return expectedAssignment.expression === submitted;
  }

  return (
    expectedAssignment.variable === submittedAssignment.variable &&
    expectedAssignment.expression === submittedAssignment.expression
  );
};
