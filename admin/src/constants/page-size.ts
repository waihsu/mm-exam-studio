export type PageSize = "narrow" | "default" | "wide" | "full";

type PageSizeRule = {
  test: RegExp;
  size: PageSize;
};

const PAGE_SIZE_RULES: PageSizeRule[] = [
  // Guard + auth
  { test: /^\/(signin|signup|forbidden|not-found)$/, size: "narrow" },

  // New item forms
  { test: /^\/questions\/new$/, size: "narrow" },
  { test: /^\/questions\/[^/]+\/edit$/, size: "narrow" },
  { test: /^\/paper-requests\/new$/, size: "narrow" },

  // Reading / mixed pages
  { test: /^\/$/, size: "wide" },
  { test: /^\/dashboard$/, size: "wide" },
  { test: /^\/settings(?:\/.*)?$/, size: "wide" },
  { test: /^\/reports(?:\/.*)?$/, size: "full" },

  // Data-heavy pages use full width in admin shell
  { test: /^\/(questions|taxonomy|paper-requests|drafts|papers|users)(?:\/.*)?$/, size: "full" },
];

const normalizePathname = (pathname: string) => {
  if (!pathname || pathname === "/") return "/";
  return pathname.replace(/\/+$/, "");
};

export const resolveRoutePageSize = (pathname: string): PageSize | null => {
  const normalized = normalizePathname(pathname);
  const matched = PAGE_SIZE_RULES.find((rule) => rule.test.test(normalized));
  return matched?.size ?? null;
};
