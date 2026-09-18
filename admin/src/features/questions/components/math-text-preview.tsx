import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  loadMathTextRenderer,
  type KatexRenderer,
} from "./math-text-renderer";

type Segment =
  | { type: "text"; value: string }
  | { type: "math"; value: string; displayMode: boolean };

type MathTextPreviewProps = {
  content?: string | null;
  className?: string;
  emptyLabel?: string;
};

const MATH_SEGMENT_PATTERN = /(\$\$[\s\S]+?\$\$|\$[^$\n]+\$)/g;

const parseSegments = (content: string): Segment[] => {
  const segments: Segment[] = [];
  let lastIndex = 0;

  for (const match of content.matchAll(MATH_SEGMENT_PATTERN)) {
    const raw = match[0];
    const index = match.index ?? 0;

    if (index > lastIndex) {
      segments.push({
        type: "text",
        value: content.slice(lastIndex, index),
      });
    }

    const displayMode = raw.startsWith("$$");
    segments.push({
      type: "math",
      value: raw.slice(displayMode ? 2 : 1, displayMode ? -2 : -1).trim(),
      displayMode,
    });

    lastIndex = index + raw.length;
  }

  if (lastIndex < content.length) {
    segments.push({
      type: "text",
      value: content.slice(lastIndex),
    });
  }

  return segments.length ? segments : [{ type: "text", value: content }];
};

const renderMath = (
  renderer: KatexRenderer | null,
  expression: string,
  displayMode: boolean,
) => {
  if (!renderer) {
    return undefined;
  }

  try {
    return renderer.renderToString(expression, {
      displayMode,
      throwOnError: true,
      output: "html",
      strict: "warn",
    });
  } catch {
    return null;
  }
};

export function MathTextPreview({
  content,
  className,
  emptyLabel = "Start typing to preview math rendering.",
}: MathTextPreviewProps) {
  const [renderer, setRenderer] = useState<KatexRenderer | null>(null);
  const value = content ?? "";

  useEffect(() => {
    let isActive = true;

    void loadMathTextRenderer().then((resolved) => {
      if (isActive) {
        setRenderer(resolved);
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  if (!value.trim().length) {
    return (
      <div
        className={cn(
          "rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-3 py-3 text-sm text-slate-500",
          className,
        )}
      >
        {emptyLabel}
      </div>
    );
  }

  const segments = parseSegments(value);

  return (
    <div
      className={cn(
        "space-y-2 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-800",
        className,
      )}
    >
      {segments.map((segment, index) => {
        if (segment.type === "text") {
          return (
            <div
              key={`text-${index}`}
              className="whitespace-pre-wrap leading-7 text-slate-700"
            >
              {segment.value}
            </div>
          );
        }

        const html = renderMath(renderer, segment.value, segment.displayMode);
        if (html === undefined) {
          return (
            <div
              key={`math-loading-${index}`}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2"
            >
              <code className="block whitespace-pre-wrap text-xs text-slate-600">
                {segment.value}
              </code>
            </div>
          );
        }

        if (html === null) {
          return (
            <div
              key={`math-${index}`}
              className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                Invalid LaTeX
              </p>
              <code className="block whitespace-pre-wrap text-xs text-amber-800">
                {segment.value}
              </code>
            </div>
          );
        }

        return (
          <div
            key={`math-${index}`}
            className={cn(segment.displayMode ? "overflow-x-auto py-2" : "inline-block")}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
    </div>
  );
}
