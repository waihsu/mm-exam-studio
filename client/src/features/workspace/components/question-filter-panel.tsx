import { useDeferredValue, useEffect, useState } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { WorkspaceFilters, WorkspaceMeta } from "../types";
import {
  getChaptersForSelection,
  getSubChaptersForChapter,
  getSubjectsForGrade,
} from "../utils/workspace-taxonomy";

type FilterPanelProps = {
  meta?: WorkspaceMeta;
  value: WorkspaceFilters;
  onChange: (next: WorkspaceFilters) => void;
  planCode?: "free" | "pro" | "premium";
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

export function QuestionFilterPanel({
  meta,
  value,
  onChange,
  planCode,
}: FilterPanelProps) {
  const [searchInput, setSearchInput] = useState(value.search);
  const deferredSearchInput = useDeferredValue(searchInput);
  const debouncedSearchInput = useDebouncedValue(deferredSearchInput, 280);
  const subjects = getSubjectsForGrade(meta, value.gradeId);
  const chapters = getChaptersForSelection(meta, value.gradeId, value.subjectId);
  const subChapters = getSubChaptersForChapter(meta, value.chapterId);
  const isFreePlan = planCode === "free";

  useEffect(() => {
    setSearchInput(value.search);
  }, [value.search]);

  useEffect(() => {
    if (debouncedSearchInput === value.search) {
      return;
    }

    onChange({
      ...value,
      search: debouncedSearchInput,
    });
  }, [debouncedSearchInput, onChange, value]);

  const update = (patch: Partial<WorkspaceFilters>) => {
    onChange({ ...value, ...patch });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Filters</p>
          {isFreePlan ? (
            <p className="mt-1 text-xs text-slate-500">
              Free plan can use free chapters and lessons only.
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => {
            setSearchInput("");
            onChange({
              search: "",
              gradeId: "",
              subjectId: "",
              chapterId: "",
              subChapterId: "",
            });
          }}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 sm:w-auto"
        >
          Clear
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <FieldBlock label="Search">
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by body or code"
            className={inputClassName}
          />
        </FieldBlock>

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

        <FieldBlock label="Sub-chapter">
          <select
            value={value.subChapterId}
            onChange={(event) => update({ subChapterId: event.target.value })}
            className={inputClassName}
          >
            <option value="">All sub-chapters</option>
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
