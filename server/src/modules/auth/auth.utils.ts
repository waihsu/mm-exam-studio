export const normalizeEmail = (v?: string | null) =>
  String(v ?? "")
    .trim()
    .toLowerCase();

export const summarizeUserAgent = (ua?: string | null) => {
  if (!ua) return "Unknown device";
  if (/iphone/i.test(ua)) return "iPhone";
  if (/android/i.test(ua)) return "Android";
  if (/mac/i.test(ua)) return "Mac";
  if (/windows/i.test(ua)) return "Windows";
  return ua.slice(0, 60);
};

export const resolveRoles = (role?: string | null) =>
  role === "admin" ? ["admin"] : ["student"];
