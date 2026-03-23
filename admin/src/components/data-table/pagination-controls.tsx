import { Button } from "@/components/ui/button";

type PaginationControlsProps = {
  page: number;
  totalPages: number;
  totalRows: number;
  from: number;
  to: number;
  pageSize: number;
  pageSizeOptions: number[];
  onPageSizeChange: (nextSize: number) => void;
  onPrev: () => void;
  onNext: () => void;
};

export function PaginationControls({
  page,
  totalPages,
  totalRows,
  from,
  to,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  onPrev,
  onNext,
}: PaginationControlsProps) {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
      <p className="text-slate-500">
        Showing {from}-{to} of {totalRows}
      </p>
      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-500">Rows</label>
        <select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          className="h-8 rounded-md border border-slate-300 bg-white px-2 text-sm"
        >
          {pageSizeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <Button size="sm" variant="outline" onClick={onPrev} disabled={page <= 1}>
          Prev
        </Button>
        <span className="min-w-20 text-center text-xs font-semibold text-slate-600">
          Page {page} / {totalPages}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={onNext}
          disabled={page >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

