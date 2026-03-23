export const parseMatchingAnswer = (rawValue: string | null | undefined) => {
  if (!rawValue?.trim()) return {} as Record<string, string>;
  try {
    const parsed = JSON.parse(rawValue) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {} as Record<string, string>;
    }
    return Object.entries(parsed).reduce<Record<string, string>>((next, [key, value]) => {
      if (typeof value !== "string") return next;
      const normalizedKey = key.trim();
      const normalizedValue = value.trim();
      if (!normalizedKey || !normalizedValue) return next;
      next[normalizedKey] = normalizedValue;
      return next;
    }, {});
  } catch {
    return {} as Record<string, string>;
  }
};
