type BlueprintEditorEmptyStateProps = {
  children: string;
};

export function BlueprintEditorEmptyState({ children }: BlueprintEditorEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
      {children}
    </div>
  );
}
