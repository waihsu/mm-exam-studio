import type { WorkspaceFilters, WorkspaceMeta } from "../types";
import {
  getChaptersForSelection,
  getSubChaptersForChapter,
  getSubjectsForGrade,
} from "../utils/workspace-taxonomy";

type QuestionScopePanelProps = {
  meta?: WorkspaceMeta;
  value: WorkspaceFilters;
  onChange: (next: WorkspaceFilters) => void;
  planCode?: "free" | "pro" | "premium";
  title?: string;
  hint?: string;
  requiredFields?: Array<"grade" | "subject">;
  surface?: "card" | "plain";
};

const inputClassName =
  "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-[0.9375rem] text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

function FieldBlock({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold text-slate-600">
        {label}
      </span>
      {children}
    </label>
  );
}

export function QuestionScopePanel({
  meta,
  value,
  onChange,
  planCode,
  title = "Scope",
  hint = "Choose the syllabus scope once, then set the exact mix below.",
  requiredFields = [],
  surface = "card",
}: QuestionScopePanelProps) {
  const subjects = getSubjectsForGrade(meta, value.gradeId);
  const chapters = getChaptersForSelection(meta, value.gradeId, value.subjectId);
  const subChapters = getSubChaptersForChapter(meta, value.chapterId);
  const isFreePlan = planCode === "free";
  const gradeRequired = requiredFields.includes("grade");
  const subjectRequired = requiredFields.includes("subject");

  const update = (patch: Partial<WorkspaceFilters>) => {
    onChange({ ...value, ...patch });
  };

  return (
    <div className={surface === "card" ? "space-y-4 rounded-xl border border-slate-200 bg-white p-4" : "space-y-5"}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[1.0625rem] font-bold text-slate-950">{title}</p>
          <p className="mt-1.5 text-sm leading-6 text-slate-500">{hint}</p>
          {isFreePlan ? (
            <p className="mt-2 text-xs text-slate-500">
              Free plan can use free preview chapters and lessons only.
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() =>
            onChange({
              search: "",
              gradeId: "",
              subjectId: "",
              chapterId: "",
              subChapterId: "",
            })
          }
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
        >
          Clear
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <FieldBlock label={<>{"Grade"}{gradeRequired ? <span className="ml-1 text-rose-600">*</span> : null}</>}>
          <select
            value={value.gradeId}
            onChange={(event) =>
              update({
                gradeId: event.target.value,
                subjectId: "",
                chapterId: "",
                subChapterId: "",
              })
            }
            className={inputClassName}
            required={gradeRequired}
          >
            <option value="">{gradeRequired ? "Select grade" : "All grades"}</option>
            {meta?.grades.map((grade) => (
              <option key={grade.id} value={grade.id}>
                {grade.name}
              </option>
            ))}
          </select>
        </FieldBlock>

        <FieldBlock label={<>{"Subject"}{subjectRequired ? <span className="ml-1 text-rose-600">*</span> : null}</>}>
          <select
            value={value.subjectId}
            onChange={(event) =>
              update({
                subjectId: event.target.value,
                chapterId: "",
                subChapterId: "",
              })
            }
            className={inputClassName}
            disabled={!value.gradeId}
            required={subjectRequired}
          >
            <option value="">
              {!value.gradeId
                ? "Choose grade first"
                : subjectRequired
                  ? "Select subject"
                  : "All subjects"}
            </option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </FieldBlock>

        <FieldBlock label="Chapter">
          <select
            value={value.chapterId}
            onChange={(event) =>
              update({
                chapterId: event.target.value,
                subChapterId: "",
              })
            }
            className={inputClassName}
            disabled={!value.subjectId}
          >
            <option value="">{value.subjectId ? "All chapters" : "Choose subject first"}</option>
            {chapters.map((chapter) => (
              <option
                key={chapter.id}
                value={chapter.id}
                disabled={isFreePlan && !chapter.isFreePreview}
              >
                {chapter.name}
                {chapter.isFreePreview ? " • Free" : isFreePlan ? " • Pro" : ""}
              </option>
            ))}
          </select>
        </FieldBlock>

        <FieldBlock label="Lesson">
          <select
            value={value.subChapterId}
            onChange={(event) => update({ subChapterId: event.target.value })}
            className={inputClassName}
            disabled={!value.chapterId}
          >
            <option value="">{value.chapterId ? "All lessons" : "Choose chapter first"}</option>
            {subChapters.map((subChapter) => (
              <option
                key={subChapter.id}
                value={subChapter.id}
                disabled={isFreePlan && !subChapter.isFreePreview}
              >
                {subChapter.name}
                {subChapter.isFreePreview ? " • Free" : isFreePlan ? " • Pro" : ""}
              </option>
            ))}
          </select>
        </FieldBlock>
      </div>
    </div>
  );
}
