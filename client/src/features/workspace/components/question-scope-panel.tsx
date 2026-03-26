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
};

const inputClassName =
  "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-900";

function FieldBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
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
}: QuestionScopePanelProps) {
  const subjects = getSubjectsForGrade(meta, value.gradeId);
  const chapters = getChaptersForSelection(meta, value.gradeId, value.subjectId);
  const subChapters = getSubChaptersForChapter(meta, value.chapterId);
  const isFreePlan = planCode === "free";

  const update = (patch: Partial<WorkspaceFilters>) => {
    onChange({ ...value, ...patch });
  };

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-sm text-slate-500">{hint}</p>
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
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          Clear
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <FieldBlock label="Grade">
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
          >
            <option value="">All grades</option>
            {meta?.grades.map((grade) => (
              <option key={grade.id} value={grade.id}>
                {grade.name}
              </option>
            ))}
          </select>
        </FieldBlock>

        <FieldBlock label="Subject">
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
          >
            <option value="">All subjects</option>
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
          >
            <option value="">All chapters</option>
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
          >
            <option value="">All lessons</option>
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
