import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type QuestionFormMediaUrlsProps = {
  questionImageUrls: string[];
  solutionImageUrls: string[];
  onQuestionImageUrlsChange: (value: string) => void;
  onSolutionImageUrlsChange: (value: string) => void;
};

export function QuestionFormMediaUrls({
  questionImageUrls,
  solutionImageUrls,
  onQuestionImageUrlsChange,
  onSolutionImageUrlsChange,
}: QuestionFormMediaUrlsProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Media URLs</p>
        <p className="text-sm text-slate-600">Add up to 4 URLs per section. Use one URL per line.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="question-image-urls">
            Question image URLs ({questionImageUrls.length}/4)
          </Label>
          <Textarea
            id="question-image-urls"
            value={questionImageUrls.join("\n")}
            onChange={(event) => onQuestionImageUrlsChange(event.target.value)}
            placeholder="https://.../diagram-1.png"
            className="min-h-24"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="solution-image-urls">
            Solution image URLs ({solutionImageUrls.length}/4)
          </Label>
          <Textarea
            id="solution-image-urls"
            value={solutionImageUrls.join("\n")}
            onChange={(event) => onSolutionImageUrlsChange(event.target.value)}
            placeholder="https://.../solution-step-1.png"
            className="min-h-24"
          />
        </div>
      </div>
    </div>
  );
}
