import { Switch } from "@/components/ui/switch";

type QuestionFormPublishStatusProps = {
  published: boolean;
  onPublishedChange: (published: boolean) => void;
};

export function QuestionFormPublishStatus({
  published,
  onPublishedChange,
}: QuestionFormPublishStatusProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-900">Publish status</p>
        <p className="text-sm text-slate-600">
          {published
            ? "This question will be available in the published bank."
            : "Publishing from this form will also mark the question as approved."}
        </p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2">
          <span className="text-sm font-medium text-slate-700">
            {published ? "Published" : "Draft"}
          </span>
          <Switch checked={published} onCheckedChange={onPublishedChange} />
        </div>
      </div>
    </div>
  );
}
