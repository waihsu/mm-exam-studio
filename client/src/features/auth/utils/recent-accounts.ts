const STORAGE_KEY = "mm-exam-studio:recent-accounts";
const MAX_RECENT_ACCOUNTS = 5;

export type RecentAccount = {
  email: string;
  name?: string | null;
  lastUsedAt: string;
};

const canUseStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export const listRecentAccounts = (): RecentAccount[] => {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const email = typeof item.email === "string" ? item.email.trim().toLowerCase() : "";
      if (!email) return [];
      return [
        {
          email,
          name: typeof item.name === "string" ? item.name : null,
          lastUsedAt:
            typeof item.lastUsedAt === "string" ? item.lastUsedAt : new Date().toISOString(),
        },
      ];
    });
  } catch {
    return [];
  }
};

const writeRecentAccounts = (items: RecentAccount[]) => {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_RECENT_ACCOUNTS)));
};

export const saveRecentAccount = (account: { email: string; name?: string | null }) => {
  const email = account.email.trim().toLowerCase();
  if (!email || !canUseStorage()) return;

  const next: RecentAccount[] = [
    {
      email,
      name: account.name ?? null,
      lastUsedAt: new Date().toISOString(),
    },
    ...listRecentAccounts().filter((item) => item.email !== email),
  ];

  writeRecentAccounts(next);
};

export const removeRecentAccount = (email: string) => {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !canUseStorage()) return;
  writeRecentAccounts(listRecentAccounts().filter((item) => item.email !== normalized));
};
