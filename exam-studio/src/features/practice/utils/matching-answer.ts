const normalizePairEntries = (pairs: Record<string, string>) =>
  Object.entries(pairs)
    .map(([left, right]) => [left.trim(), right.trim()] as const)
    .filter(([left, right]) => left.length > 0 && right.length > 0);

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
    // Ignore and continue with plain text parser.
  }

  return trimmed.split("|").reduce<Record<string, string>>((pairs, segment) => {
    const [left, right] = segment.split(":", 2).map((value) => value?.trim() ?? "");
    if (!left || !right) return pairs;
    pairs[left] = right;
    return pairs;
  }, {});
};

export const stringifyMatchingAnswer = (pairs: Record<string, string>) => {
  const normalized = normalizePairEntries(pairs);
  if (normalized.length === 0) {
    return "";
  }

  const payload = normalized.reduce<Record<string, string>>((next, [left, right]) => {
    next[left] = right;
    return next;
  }, {});

  return JSON.stringify(payload);
};

