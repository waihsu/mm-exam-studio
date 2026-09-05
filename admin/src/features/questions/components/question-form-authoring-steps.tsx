type QuestionAuthoringStage = {
  id: string;
  label: string;
  complete: boolean;
};

type QuestionFormAuthoringStepsProps = {
  stages: QuestionAuthoringStage[];
};

export function QuestionFormAuthoringSteps({ stages }: QuestionFormAuthoringStepsProps) {
  return (
    <nav
      aria-label="Question authoring steps"
      className="sticky top-3 z-20 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-sm backdrop-blur-sm"
    >
      <div className="grid gap-1 sm:grid-cols-4">
        {stages.map((stage) => (
          <a
            key={stage.id}
            href={`#${stage.id}`}
            className="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                stage.complete
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-200 text-slate-600 group-hover:bg-slate-300"
              }`}
            >
              {stage.complete ? "✓" : stage.label.slice(0, 1)}
            </span>
            <span>{stage.label.replace(/^\d\.\s/, "")}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}
