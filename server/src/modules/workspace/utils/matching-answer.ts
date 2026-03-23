export const normalizeAnswer = (value: string | null | undefined) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

export const canonicalizeMatchingPairs = (pairs: Record<string, string>) =>
  Object.entries(pairs)
    .map(([left, right]) => [normalizeAnswer(left), normalizeAnswer(right)] as const)
    .filter(([left, right]) => left.length > 0 && right.length > 0)
    .sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]))
    .map(([left, right]) => `${left}:${right}`)
    .join("|");

export const formatMatchingPairs = (pairs: Record<string, string>) =>
  Object.entries(pairs)
    .map(([left, right]) => [left.trim(), right.trim()] as const)
    .filter(([left, right]) => left.length > 0 && right.length > 0)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([left, right]) => `${left} -> ${right}`)
    .join(" | ");

export const parseMatchingAnswer = (rawValue: string | null | undefined) => {
  const trimmed = String(rawValue ?? "").trim();
  if (!trimmed) return {} as Record<string, string>;

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.entries(parsed).reduce<Record<string, string>>((pairs, [left, right]) => {
        if (typeof right !== "string") return pairs;
        const nextLeft = left.trim();
        const nextRight = right.trim();
        if (!nextLeft || !nextRight) return pairs;
        pairs[nextLeft] = nextRight;
        return pairs;
      }, {});
    }
  } catch {
    // Fall back to plain-text format (left:right|left:right).
  }

  return trimmed.split("|").reduce<Record<string, string>>((pairs, segment) => {
    const [left, right] = segment.split(":", 2).map((part) => part?.trim() ?? "");
    if (!left || !right) return pairs;
    pairs[left] = right;
    return pairs;
  }, {});
};
