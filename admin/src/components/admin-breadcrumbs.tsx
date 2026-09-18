import { Fragment } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { ADMIN_ROUTES } from "@/constants/routes";
import { useLanguage } from "@/i18n";

const HIDDEN_PATHS: ReadonlySet<string> = new Set([
  ADMIN_ROUTES.dashboard,
  ADMIN_ROUTES.signIn,
  ADMIN_ROUTES.forbidden,
  ADMIN_ROUTES.notFound,
]);

const LABELS = {
  classes: { en: "Classes", my: "အတန်းများ" },
  subjects: { en: "Subjects", my: "ဘာသာရပ်များ" },
  "class-subjects": { en: "Class Subjects", my: "အတန်း-ဘာသာချိတ်ဆက်မှု" },
  courses: { en: "Courses", my: "သင်ခန်းစာများ" },
  quizzes: { en: "Quizzes", my: "မေးခွန်းစမ်းသပ်မှု" },
  questions: { en: "Question Bank", my: "မေးခွန်းဘဏ်" },
  taxonomy: { en: "Taxonomy", my: "Taxonomy" },
  grades: { en: "Grades", my: "အတန်းများ" },
  "exam-generator": { en: "Exam Generator", my: "စာမေးပွဲဖန်တီးမှု" },
  "exam-question-bank": { en: "Question Bank", my: "မေးခွန်းဘဏ်" },
  drafts: { en: "Drafts", my: "မူကြမ်းများ" },
  builder: { en: "Builder", my: "တည်ဆောက်မှု" },
  list: { en: "Draft List", my: "မူကြမ်းစာရင်း" },
  templates: { en: "Templates", my: "Template များ" },
  "pdf-presets": { en: "PDF Presets", my: "PDF Preset များ" },
  support: { en: "Support", my: "ပံ့ပိုးမှု" },
  settings: { en: "Settings", my: "ဆက်တင်" },
  teachers: { en: "Teachers", my: "ဆရာများ" },
  audit: { en: "Audit", my: "လုပ်ဆောင်မှုမှတ်တမ်း" },
  "web-performance": { en: "Performance", my: "စွမ်းဆောင်ရည်" },
  options: { en: "Options", my: "ရွေးချယ်မှုများ" },
  profile: { en: "Profile", my: "ပရိုဖိုင်" },
  security: { en: "Security", my: "လုံခြုံရေး" },
  integrations: { en: "Integrations", my: "ချိတ်ဆက်မှုများ" },
  chapters: { en: "Chapters", my: "အခန်းများ" },
  "sub-chapters": { en: "Sub Chapters", my: "ခွဲအခန်းများ" },
  lessons: { en: "Lessons", my: "သင်ခန်းစာများ" },
  items: { en: "Items", my: "အကြောင်းအရာများ" },
  textbook: { en: "Textbook", my: "စာအုပ်" },
  import: { en: "Import", my: "တင်သွင်းမှု" },
};

const RESOURCE_LABELS = {
  classes: { en: "Class", my: "အတန်း" },
  subjects: { en: "Subject", my: "ဘာသာရပ်" },
  "class-subjects": { en: "Class Subject", my: "အတန်း-ဘာသာချိတ်ဆက်မှု" },
  courses: { en: "Course", my: "သင်ခန်းစာ" },
  chapters: { en: "Chapter", my: "အခန်း" },
  lessons: { en: "Lesson", my: "သင်ခန်းစာ" },
  items: { en: "Item", my: "အကြောင်းအရာ" },
  options: { en: "Option", my: "ရွေးချယ်မှု" },
  quizzes: { en: "Quiz", my: "မေးခွန်းစမ်းသပ်မှု" },
  questions: { en: "Question", my: "မေးခွန်း" },
  grades: { en: "Grade", my: "အတန်း" },
  teachers: { en: "Teacher", my: "ဆရာ" },
};

const isLikelyId = (segment: string) =>
  /^[a-f0-9-]{8,}$/i.test(segment) || /^[0-9]+$/.test(segment);

const prettifySegment = (
  segment: string,
  index: number,
  segments: string[],
  tr: (value: { en: string; my: string }) => string,
) => {
  if (LABELS[segment as keyof typeof LABELS]) {
    return tr(LABELS[segment as keyof typeof LABELS]);
  }

  if (isLikelyId(segment)) {
    const parent = segments[index - 1];
    const resource = RESOURCE_LABELS[parent as keyof typeof RESOURCE_LABELS];
    return resource
      ? `${tr(resource)} ${tr({ en: "Detail", my: "အသေးစိတ်" })}`
      : tr({ en: "Detail", my: "အသေးစိတ်" });
  }

  if (segment === "new") {
    const parent = segments[index - 1];
    const resource = RESOURCE_LABELS[parent as keyof typeof RESOURCE_LABELS];
    return resource
      ? `${tr({ en: "New", my: "အသစ်" })} ${tr(resource)}`
      : tr({ en: "New", my: "အသစ်" });
  }

  if (segment === "edit") {
    const parent = segments[index - 2];
    const resource = RESOURCE_LABELS[parent as keyof typeof RESOURCE_LABELS];
    return resource
      ? `${tr({ en: "Edit", my: "ပြင်ဆင်ရန်" })} ${tr(resource)}`
      : tr({ en: "Edit", my: "ပြင်ဆင်ရန်" });
  }

  if (segment === "questions" && segments[index - 2] === "quizzes") {
    return tr({ en: "Question Bank", my: "မေးခွန်းစုစည်းမှု" });
  }

  return segment
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

export function AdminBreadcrumbs() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const { tr } = useLanguage();

  if (HIDDEN_PATHS.has(pathname)) return null;
  if (
    pathname.startsWith(`${ADMIN_ROUTES.settings}/`) ||
    pathname === ADMIN_ROUTES.settings
  ) {
    return null;
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 2) return null;

  const crumbs = segments.map((segment, index) => ({
    label: prettifySegment(segment, index, segments, tr),
    to: `/${segments.slice(0, index + 1).join("/")}`,
  }));

  return (
    <div className="sticky top-[var(--admin-header-height,4rem)] z-30 w-full px-4 pt-2.5 sm:px-5 md:px-6 lg:top-0 xl:px-7">
      <nav
        aria-label="Breadcrumb"
        className="rounded-xl border border-[#d8d4c9]/80 bg-[#fffdf8]/92 px-3 py-2 text-sm text-[#6e706b] shadow-[0_10px_24px_-20px_rgba(32,35,33,0.45)] ring-1 ring-[#202321]/5 backdrop-blur-md"
      >
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link
              to={ADMIN_ROUTES.dashboard}
              className="font-medium transition-colors hover:text-[#48766b]"
            >
              {tr({ en: "Dashboard", my: "ဒက်ရှ်ဘုတ်" })}
            </Link>
          </li>
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;
            return (
              <Fragment key={crumb.to}>
                <li aria-hidden="true" className="text-[#9a9d96]">
                  <ChevronRight className="h-3.5 w-3.5" />
                </li>
                <li>
                  {isLast ? (
                      <span className="font-semibold text-[#202321]">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      to={crumb.to}
                      className="font-medium transition-colors hover:text-[#48766b]"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </li>
              </Fragment>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
