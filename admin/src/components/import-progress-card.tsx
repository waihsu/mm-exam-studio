import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UploadRequestProgress } from "@/lib/server-http";

type ImportProgressCardProps = {
  title: string;
  detail: string;
  progress: UploadRequestProgress | null;
};

const resolvePhaseLabel = (phase: UploadRequestProgress["phase"]) => {
  if (phase === "uploading") return "Uploading file";
  if (phase === "processing") return "Processing PDF";
  return "Completed";
};

export function ImportProgressCard({
  title,
  detail,
  progress,
}: ImportProgressCardProps) {
  if (!progress) return null;

  const percent = progress.percent ?? (progress.phase === "processing" ? 100 : 0);
  const barWidth = progress.phase === "processing" ? "100%" : `${percent}%`;

  return (
    <Card className="border-cyan-300/80 bg-cyan-50/90">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm text-cyan-950">
          <Loader2 className="h-4 w-4 animate-spin" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-cyan-950">
        <div className="flex items-center justify-between gap-3">
          <span className="font-medium">{resolvePhaseLabel(progress.phase)}</span>
          <span className="text-xs uppercase tracking-wide text-cyan-800">
            {progress.phase === "processing" ? "server-side work" : `${percent}%`}
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-cyan-100">
          <div
            className={`h-full rounded-full bg-cyan-600 transition-all duration-300 ${
              progress.phase === "processing" ? "animate-pulse" : ""
            }`}
            style={{ width: barWidth }}
          />
        </div>

        <p className="text-xs text-cyan-900/80">{detail}</p>
      </CardContent>
    </Card>
  );
}
