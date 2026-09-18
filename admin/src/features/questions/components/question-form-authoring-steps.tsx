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
      className="sticky top-3 z-20 rounded-2xl border border-[#d8d4c9] bg-[#fffdf8]/95 p-2 shadow-[0_14px_30px_-24px_rgba(32,35,33,0.4)] backdrop-blur-sm"
    >
      <div className="grid gap-1 sm:grid-cols-4">
        {stages.map((stage) => (
          <a
            key={stage.id}
            href={`#${stage.id}`}
            className="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#6e706b] transition hover:bg-[#e7efe9] hover:text-[#202321] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7fa99d]"
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                stage.complete
                  ? "bg-[#48766b] text-white"
                  : "bg-[#e8e2d7] text-[#6e706b] group-hover:bg-[#c9dcd3]"
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
