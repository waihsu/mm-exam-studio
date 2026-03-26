import { Notice } from "@/components/ui/notice";
import type { WorkspaceCatalogQuickCountsResponse, WorkspaceQuestionType } from "../types";

type MixItem<TType extends string> = {
  type: TType;
  label: string;
  helperText?: string;
};

type QuestionMixPanelProps<TType extends string> = {
  title?: string;
  hint?: string;
  items: MixItem<TType>[];
  values: Record<TType, string>;
  onChange: (type: TType, value: string) => void;
  totalPlanned: number;
  availableCounts?: WorkspaceCatalogQuickCountsResponse | null;
  unavailableMessage?: string | null;
};

const clampNumberInput = (raw: string) => raw.replace(/[^\d]/g, "").slice(0, 2);

export function QuestionMixPanel<TType extends WorkspaceQuestionType>({
  title = "Mini Blueprint",
  hint = "Set exact counts by question type. Leave all rows at 0 to use the fallback count.",
  items,
  values,
  onChange,
  totalPlanned,
  availableCounts,
  unavailableMessage,
}: QuestionMixPanelProps<TType>) {
  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{hint}</p>
      </div>

      <div className="grid gap-3">
        {items.map((item) => {
          const value = values[item.type] ?? "0";
          const available =
            availableCounts && item.type in availableCounts
              ? availableCounts[item.type as keyof WorkspaceCatalogQuickCountsResponse]
              : null;

          return (
            <div
              key={item.type}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{item.label}</p>
                  {item.helperText ? (
                    <p className="mt-1 text-xs text-slate-500">{item.helperText}</p>
                  ) : null}
                  {typeof available === "number" ? (
                    <p className="mt-1 text-xs font-medium text-slate-600">
                      {available} available
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() =>
                      onChange(
                        item.type,
                        String(Math.max(0, (Number.parseInt(value || "0", 10) || 0) - 1)),
                      )
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-lg font-bold text-slate-700 transition hover:border-slate-900"
                  >
                    -
                  </button>
                  <input
                    value={value}
                    onChange={(event) => onChange(item.type, clampNumberInput(event.target.value))}
                    inputMode="numeric"
                    className="h-10 w-16 rounded-lg border border-slate-300 bg-white px-2 text-center text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onChange(
                        item.type,
                        String(Math.min(50, (Number.parseInt(value || "0", 10) || 0) + 1)),
                      )
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-lg font-bold text-slate-700 transition hover:border-slate-900"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
            Planned questions
          </p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{totalPlanned}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
            Active types
          </p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {items.filter((item) => (Number.parseInt(values[item.type] || "0", 10) || 0) > 0).length}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
            Mode
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {totalPlanned > 0 ? "Exact mix" : "Fallback count"}
          </p>
        </div>
      </div>

      {totalPlanned > 50 ? (
        <Notice tone="error">Planned mix cannot exceed 50 questions.</Notice>
      ) : null}
      {unavailableMessage ? <Notice tone="error">{unavailableMessage}</Notice> : null}
    </div>
  );
}
