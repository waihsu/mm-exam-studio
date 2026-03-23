const DEFAULT_DEVELOPMENT_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

const normalizeOrigin = (value: string) => value.trim().replace(/\/+$/, "");

const toUniqueOrigins = (values: string[]) => [
  ...new Set(values.map(normalizeOrigin).filter(Boolean)),
];

const parseOriginList = (value: string | undefined) =>
  (value ?? "")
    .split(",")
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);

type ResolveOriginsParams = {
  raw: string | undefined;
  includeDevelopmentDefaults: boolean;
  extras?: string[];
};

export const resolveExactOrigins = (params: ResolveOriginsParams) => {
  const base = parseOriginList(params.raw);
  const defaults = params.includeDevelopmentDefaults
    ? DEFAULT_DEVELOPMENT_ORIGINS
    : [];

  // Wildcard မသုံးဘဲ origin တိတိကျကျပဲ whitelist လုပ်ဖို့ normalized list ပြန်ပေး
  return toUniqueOrigins([...defaults, ...(params.extras ?? []), ...base]);
};

export const toOriginSet = (origins: string[]) =>
  new Set(toUniqueOrigins(origins));

export const getRequestOrigin = (request: Request) => {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  return normalizeOrigin(origin);
};
