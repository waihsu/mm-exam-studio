import type { LocalizedText } from "@/i18n";

export const ADMIN_ROUTES = {
  home: "/",
  signIn: "/signin",
  signUp: "/signup",
  forbidden: "/forbidden",
  dashboard: "/dashboard",
  questions: "/questions",
  questionBlueprints: "/questions/blueprints",
  questionBlueprintsNew: "/questions/blueprints/new",
  questionsNew: "/questions/new",
  questionsImport: "/questions/import",
  taxonomy: "/taxonomy",
  taxonomyGrades: "/taxonomy/grades",
  taxonomySubjects: "/taxonomy/subjects",
  taxonomyChapters: "/taxonomy/chapters",
  taxonomySubChapters: "/taxonomy/sub-chapters",
  users: "/users",
  userSubscriptions: "/users/subscriptions",
  userSupport: "/users/support",
  settings: "/settings",
  settingsProfile: "/settings/profile",
  settingsSecurity: "/settings/security",
  notFound: "/not-found",
} as const;

export const buildAdminQuestionEditRoute = (questionId: string) =>
  `/questions/${questionId}/edit` as const;

export const buildAdminQuestionRoute = (questionId: string) =>
  `/questions/${questionId}` as const;

export const buildAdminQuestionBlueprintEditRoute = (blueprintId: string) =>
  `/questions/blueprints/${blueprintId}/edit` as const;

export type AdminRoutePath = Exclude<
  (typeof ADMIN_ROUTES)[keyof typeof ADMIN_ROUTES],
  typeof ADMIN_ROUTES.notFound
>;

export type AdminNavItem = {
  label: LocalizedText;
  to: AdminRoutePath;
  adminOnly?: boolean;
  superadminOnly?: boolean;
};

export type AdminNavGroup = {
  id: string;
  label: LocalizedText;
  items: AdminNavItem[];
};

export const ADMIN_SIDEBAR_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: "overview",
    label: { en: "Overview", my: "အနှစ်ချုပ်" },
    items: [
      {
        label: { en: "Dashboard", my: "ဒက်ရှ်ဘုတ်" },
        to: ADMIN_ROUTES.dashboard,
      },
    ],
  },
  {
    id: "content",
    label: { en: "Content", my: "အကြောင်းအရာ" },
    items: [
      {
        label: { en: "Question Bank", my: "မေးခွန်းဘဏ်" },
        to: ADMIN_ROUTES.questions,
      },
      {
        label: { en: "Taxonomy Control", my: "Taxonomy စီမံခန့်ခွဲမှု" },
        to: ADMIN_ROUTES.taxonomy,
      },
    ],
  },
  {
    id: "people",
    label: { en: "People", my: "အသုံးပြုသူများ" },
    items: [
      {
        label: { en: "Users", my: "အသုံးပြုသူများ" },
        to: ADMIN_ROUTES.users,
      },
      {
        label: { en: "Support Inbox", my: "အကူအညီစာများ" },
        to: ADMIN_ROUTES.userSupport,
      },
    ],
  },
  {
    id: "configuration",
    label: { en: "Configuration", my: "စနစ်ဆက်တင်" },
    items: [
      {
        label: { en: "Settings", my: "ဆက်တင်" },
        to: ADMIN_ROUTES.settings,
      },
    ],
  },
];
