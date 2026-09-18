type QuestionReviewStatCardProps = {
  label: string;
  value: string;
  tone?: "slate" | "emerald" | "amber" | "sky";
};

export function QuestionReviewStatCard({
  label,
  value,
  tone = "slate",
}: QuestionReviewStatCardProps) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50/85"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50/85"
        : tone === "sky"
          ? "border-sky-200 bg-sky-50/85"
          : "border-slate-200 bg-white/90";

  return (
    <div className={`rounded-2xl border px-3 py-2 ${toneClass}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-base font-black text-slate-900">{value}</p>
    </div>
  );
}
