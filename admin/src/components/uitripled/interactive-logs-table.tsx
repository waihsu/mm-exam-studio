import { ChevronDown, Filter, RefreshCw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PaginationControls } from "@/components/data-table/pagination-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Severity = "info" | "warning" | "error";

export type InteractiveLogRow = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actor: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

type InteractiveLogsTableProps = {
  rows: InteractiveLogRow[];
  title?: string;
  description?: string;
  isRefreshing?: boolean;
  onRefresh?: () => void;
};

type FilterState = {
  action: string;
  entityType: string;
  actor: string;
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const inferSeverity = (action: string): Severity => {
  const normalized = action.toLowerCase();
  if (normalized.includes("delete") || normalized.includes("revoke") || normalized.includes("sign-out")) {
    return "error";
  }
  if (normalized.includes("update") || normalized.includes("publish") || normalized.includes("limit")) {
    return "warning";
  }
  return "info";
};

const severityClassName: Record<Severity, string> = {
  info: "border-blue-200 bg-blue-50 text-blue-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  error: "border-rose-200 bg-rose-50 text-rose-700",
};

const safeJsonStringify = (value: Record<string, unknown> | undefined) =>
  value ? JSON.stringify(value, null, 2) : "{}";

const toDisplayDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};

const includesCaseInsensitive = (source: string, needle: string) =>
  source.toLowerCase().includes(needle.toLowerCase());

export function InteractiveLogsTable({
  rows,
  title = "Interactive Security Logs",
  description = "Filter and inspect recent security-related activity.",
  isRefreshing,
  onRefresh,
}: InteractiveLogsTableProps) {
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [filters, setFilters] = useState<FilterState>({
    action: "",
    entityType: "",
    actor: "",
  });

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (search.trim()) {
        const q = search.trim();
        const searchable = `${row.action} ${row.entityType} ${row.entityId} ${row.actor}`;
        if (!includesCaseInsensitive(searchable, q)) return false;
      }

      if (filters.action && row.action !== filters.action) return false;
      if (filters.entityType && row.entityType !== filters.entityType) return false;
      if (filters.actor.trim() && !includesCaseInsensitive(row.actor, filters.actor.trim())) {
        return false;
      }

      return true;
    });
  }, [rows, search, filters]);

  const total = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const offset = (page - 1) * pageSize;
  const pagedRows = filteredRows.slice(offset, offset + pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, filters.action, filters.entityType, filters.actor, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const actionOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.action))).sort((a, b) => a.localeCompare(b)),
    [rows],
  );
  const entityTypeOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.entityType))).sort((a, b) => a.localeCompare(b)),
    [rows],
  );

  const activeFilterCount = [filters.action, filters.entityType, filters.actor]
    .filter((value) => value.trim().length > 0)
    .length;

  const from = total === 0 ? 0 : offset + 1;
  const to = total === 0 ? 0 : Math.min(offset + pagedRows.length, total);

  return (
    <section className="w-full overflow-hidden rounded-2xl border border-slate-300 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-black text-slate-900">{title}</h3>
            <p className="text-sm text-slate-600">{description}</p>
          </div>
          <Button variant="outline" onClick={onRefresh} disabled={Boolean(isRefreshing) || !onRefresh}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <div className="relative min-w-[260px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search action, entity, actor..."
              className="pl-9"
            />
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters((current) => !current)}
            className="relative"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {activeFilterCount > 0 ? <Badge className="ml-2 h-5 min-w-5 px-1">{activeFilterCount}</Badge> : null}
          </Button>
        </div>
      </div>

      <div className="flex">
        {showFilters ? (
          <aside className="w-[320px] border-r border-slate-200 bg-slate-50/60 p-4">
            <div className="space-y-3">
              <Input
                value={filters.actor}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    actor: event.target.value,
                  }))
                }
                placeholder="Actor email"
              />

              <select
                value={filters.action}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, action: event.target.value }))
                }
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
              >
                <option value="">All actions</option>
                {actionOptions.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>

              <select
                value={filters.entityType}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, entityType: event.target.value }))
                }
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
              >
                <option value="">All entity types</option>
                {entityTypeOptions.map((entityType) => (
                  <option key={entityType} value={entityType}>
                    {entityType}
                  </option>
                ))}
              </select>

              <Button
                variant="outline"
                onClick={() =>
                  setFilters({
                    action: "",
                    entityType: "",
                    actor: "",
                  })
                }
              >
                Clear filters
              </Button>
            </div>
          </aside>
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="divide-y divide-slate-200">
            {pagedRows.length > 0 ? (
              pagedRows.map((row) => {
                const expanded = expandedId === row.id;
                const severity = inferSeverity(row.action);

                return (
                  <div key={row.id}>
                    <button
                      type="button"
                      onClick={() => setExpandedId((current) => (current === row.id ? null : row.id))}
                      className="w-full px-4 py-3 text-left transition-colors hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`transition-transform ${expanded ? "rotate-180" : ""}`}>
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        </span>
                        <Badge variant="outline" className={`capitalize ${severityClassName[severity]}`}>
                          {severity}
                        </Badge>
                        <span className="min-w-[180px] truncate text-sm font-semibold text-slate-900">
                          {row.action}
                        </span>
                        <span className="min-w-[110px] truncate text-xs text-slate-600">
                          {row.entityType}
                        </span>
                        <span className="flex-1 truncate text-xs text-slate-500">{row.entityId}</span>
                        <span className="min-w-[220px] truncate text-xs text-slate-500">{row.actor}</span>
                        <span className="min-w-[170px] text-right text-xs text-slate-500">
                          {toDisplayDate(row.createdAt)}
                        </span>
                      </div>
                    </button>

                    {expanded ? (
                      <div className="bg-slate-50/70 px-6 py-4">
                        <div className="grid gap-4 lg:grid-cols-2">
                          <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Context
                            </p>
                            <p className="text-xs text-slate-700">
                              <span className="font-semibold text-slate-900">Actor:</span> {row.actor}
                            </p>
                            <p className="text-xs text-slate-700">
                              <span className="font-semibold text-slate-900">Entity:</span> {row.entityType} / {row.entityId}
                            </p>
                            <p className="text-xs text-slate-700">
                              <span className="font-semibold text-slate-900">Created:</span> {toDisplayDate(row.createdAt)}
                            </p>
                          </div>

                          <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Metadata
                            </p>
                            <pre className="max-h-64 overflow-auto rounded-lg bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-100">
                              {safeJsonStringify(row.metadata)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-10 text-sm text-slate-500">No log rows match current filters.</div>
            )}
          </div>

          <div className="border-t border-slate-200 px-4 pb-3">
            <PaginationControls
              page={page}
              totalPages={totalPages}
              totalRows={total}
              from={from}
              to={to}
              pageSize={pageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onPageSizeChange={setPageSize}
              onPrev={() => setPage((current) => Math.max(1, current - 1))}
              onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
