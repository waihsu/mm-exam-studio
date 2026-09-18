import { useDeferredValue, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  QuestionDifficulty,
  QuestionFilters,
  QuestionMeta,
  QuestionMode,
  QuestionType,
} from "../types/question.type";
import {
  getChaptersForSelection,
  getSubChaptersForChapter,
  getSubjectsForGrade,
} from "../utils/question-taxonomy";

type QuestionFilterBarProps = {
  filters: QuestionFilters;
  meta?: QuestionMeta;
  onChange: (next: QuestionFilters) => void;
  onReset: () => void;
};

const TYPE_OPTIONS: Array<{ value: QuestionType; label: string }> = [
  { value: "mcq", label: "MCQ" },
  { value: "true_false", label: "True / False" },
  { value: "short_answer", label: "Short Answer" },
  { value: "long_answer", label: "Long Answer" },
  { value: "fill_blank", label: "Fill in the Blank" },
  { value: "matching", label: "Matching" },
];

const MODE_OPTIONS: Array<{ value: QuestionMode; label: string }> = [
  { value: "static", label: "Static" },
  { value: "variable", label: "Variable" },
];

const DIFFICULTY_OPTIONS: Array<{ value: QuestionDifficulty; label: string }> = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

export function QuestionFilterBar({
  filters,
  meta,
  onChange,
  onReset,
}: QuestionFilterBarProps) {
  const [searchInput, setSearchInput] = useState(filters.search ?? "");
  const [showAdvanced, setShowAdvanced] = useState(
    Boolean(
      filters.type ||
        filters.mode ||
        typeof filters.isPublished === "boolean" ||
        filters.chapterId ||
        filters.subChapterId ||
        filters.difficulty,
    ),
  );
  const deferredSearchInput = useDeferredValue(searchInput);
  const debouncedSearchInput = useDebouncedValue(deferredSearchInput, 280);
  const subjects = getSubjectsForGrade(meta, filters.gradeId ?? "");
  const chapters = getChaptersForSelection(
    meta,
    filters.gradeId ?? "",
    filters.subjectId ?? "",
  );
  const subChapters = getSubChaptersForChapter(meta, filters.chapterId ?? "");
  const activeFilterCount = [
    filters.search?.trim(),
    filters.gradeId,
    filters.subjectId,
    filters.chapterId,
    filters.subChapterId,
    filters.type,
    filters.mode,
    filters.difficulty,
    typeof filters.isPublished === "boolean" ? String(filters.isPublished) : undefined,
  ].filter(Boolean).length;

  useEffect(() => {
    setSearchInput(filters.search ?? "");
  }, [filters.search]);

  useEffect(() => {
    const currentSearch = filters.search ?? "";
    if (debouncedSearchInput === currentSearch) {
      return;
    }

    onChange({
      ...filters,
      search: debouncedSearchInput || undefined,
    });
  }, [debouncedSearchInput, filters, onChange]);

  useEffect(() => {
    if (
      filters.type ||
      filters.mode ||
      typeof filters.isPublished === "boolean" ||
      filters.chapterId ||
      filters.subChapterId ||
      filters.difficulty
    ) {
      setShowAdvanced(true);
    }
  }, [
    filters.chapterId,
    filters.difficulty,
    filters.isPublished,
    filters.mode,
    filters.subChapterId,
    filters.type,
  ]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[#202321]">Filter questions</p>
          <p className="text-xs text-[#6e706b]">
            Narrow the bank by taxonomy, content type, publish state, or question mode.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-[#d8d4c9] bg-[#fffdf8] text-[#202321] hover:border-[#7fa99d] hover:bg-[#f8f5ee]"
            onClick={() => setShowAdvanced((current) => !current)}
          >
            <SlidersHorizontal className="mr-2 h-3.5 w-3.5" />
            {showAdvanced ? "Hide details" : "More filters"}
          </Button>
          {activeFilterCount > 0 ? (
            <>
              <Badge variant="outline" className="w-fit border-[#c9dcd3] bg-[#e7efe9] text-[#2b554d]">
                {activeFilterCount} active filter{activeFilterCount > 1 ? "s" : ""}
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-[#6e706b] hover:bg-[#f5e4da] hover:text-[#8f4437]"
                onClick={onReset}
              >
                <X className="mr-1.5 h-3.5 w-3.5" />
                Clear
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-12">
      <div className="relative md:col-span-2 xl:col-span-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search by question body or code"
          className="h-11 pl-9"
        />
      </div>

      <Select
        value={filters.gradeId ?? "__all__"}
        onValueChange={(value) =>
          onChange({
            ...filters,
            gradeId: value === "__all__" ? undefined : value,
            subjectId: undefined,
            chapterId: undefined,
            subChapterId: undefined,
          })
        }
      >
        <SelectTrigger className="h-11 w-full xl:col-span-2">
          <SelectValue placeholder="All grades" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All grades</SelectItem>
          {meta?.grades.map((grade) => (
            <SelectItem key={grade.id} value={grade.id}>
              {grade.code ? `${grade.code} · ${grade.name}` : grade.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.subjectId ?? "__all__"}
        onValueChange={(value) =>
          onChange({
            ...filters,
            subjectId: value === "__all__" ? undefined : value,
            chapterId: undefined,
            subChapterId: undefined,
          })
        }
      >
        <SelectTrigger className="h-11 w-full xl:col-span-2">
          <SelectValue placeholder="All subjects" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All subjects</SelectItem>
          {subjects.map((subject) => (
            <SelectItem key={subject.id} value={subject.id}>
              {subject.code ? `${subject.code} · ${subject.name}` : subject.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showAdvanced ? <div className="grid gap-3 border-t border-[#e8e2d7] pt-3 md:grid-cols-2 xl:grid-cols-8">
      <Select
        value={filters.type ?? "__all__"}
        onValueChange={(value) =>
          onChange({
            ...filters,
            type: value === "__all__" ? undefined : (value as QuestionType),
          })
        }
      >
        <SelectTrigger className="h-11 w-full xl:col-span-2">
          <SelectValue placeholder="All types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All types</SelectItem>
          {TYPE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.mode ?? "__all__"}
        onValueChange={(value) =>
          onChange({
            ...filters,
            mode: value === "__all__" ? undefined : (value as QuestionMode),
          })
        }
      >
        <SelectTrigger className="h-11 w-full xl:col-span-2">
          <SelectValue placeholder="All modes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All modes</SelectItem>
          {MODE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={
          typeof filters.isPublished === "boolean"
            ? filters.isPublished
              ? "published"
              : "draft"
            : "all"
        }
        onValueChange={(value) =>
          onChange({
            ...filters,
            isPublished:
              value === "published"
                ? true
                : value === "draft"
                  ? false
                  : undefined,
          })
        }
      >
        <SelectTrigger className="h-11 w-full xl:col-span-2">
          <SelectValue placeholder="Publish state" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All states</SelectItem>
          <SelectItem value="published">Published</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.chapterId ?? "__all__"}
        onValueChange={(value) =>
          onChange({
            ...filters,
            chapterId: value === "__all__" ? undefined : value,
            subChapterId: undefined,
          })
        }
      >
        <SelectTrigger className="h-11 w-full xl:col-span-3">
          <SelectValue placeholder="All chapters" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All chapters</SelectItem>
          {chapters.map((chapter) => (
            <SelectItem key={chapter.id} value={chapter.id}>
              {chapter.code ? `${chapter.code} · ${chapter.name}` : chapter.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.subChapterId ?? "__all__"}
        onValueChange={(value) =>
          onChange({
            ...filters,
            subChapterId: value === "__all__" ? undefined : value,
          })
        }
      >
        <SelectTrigger className="h-11 w-full xl:col-span-3">
          <SelectValue placeholder="All sub chapters" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All sub chapters</SelectItem>
          {subChapters.map((subChapter) => (
            <SelectItem key={subChapter.id} value={subChapter.id}>
              {subChapter.code
                ? `${subChapter.code} · ${subChapter.name}`
                : subChapter.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.difficulty ?? "__all__"}
        onValueChange={(value) =>
          onChange({
            ...filters,
            difficulty:
              value === "__all__" ? undefined : (value as QuestionDifficulty),
          })
        }
      >
        <SelectTrigger className="h-11 w-full xl:col-span-2">
          <SelectValue placeholder="Difficulty" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All difficulty</SelectItem>
          {DIFFICULTY_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      </div> : null}
    </div>
    </div>
  );
}
