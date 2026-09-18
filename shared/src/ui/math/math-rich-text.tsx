import { useEffect, useState } from "react"

type Segment =
  | { type: "text"; value: string }
  | { type: "math"; value: string; displayMode: boolean }

type MathRichTextProps = {
  content?: string | null
  className?: string
  textClassName?: string
  inline?: boolean
}

type KatexRenderer = {
  renderToString: (
    expression: string,
    options: {
      displayMode: boolean
      throwOnError: boolean
      output: "html"
      strict: "warn"
    },
  ) => string
}

const MATH_SEGMENT_PATTERN = /(\$\$[\s\S]+?\$\$|\$[^$\n]+\$)/g

const joinClasses = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(" ")

export const parseMathRichTextSegments = (content: string): Segment[] => {
  const segments: Segment[] = []
  let lastIndex = 0

  for (const match of content.matchAll(MATH_SEGMENT_PATTERN)) {
    const raw = match[0]
    const index = match.index ?? 0

    if (index > lastIndex) {
      segments.push({
        type: "text",
        value: content.slice(lastIndex, index),
      })
    }

    const displayMode = raw.startsWith("$$")
    segments.push({
      type: "math",
      value: raw.slice(displayMode ? 2 : 1, displayMode ? -2 : -1).trim(),
      displayMode,
    })

    lastIndex = index + raw.length
  }

  if (lastIndex < content.length) {
    segments.push({
      type: "text",
      value: content.slice(lastIndex),
    })
  }

  return segments.length > 0 ? segments : [{ type: "text", value: content }]
}

let katexLoader: Promise<KatexRenderer> | null = null

const loadKatex = async (): Promise<KatexRenderer> => {
  if (!katexLoader) {
    katexLoader = Promise.all([
      import("katex/dist/katex.min.css"),
      import("katex"),
    ]).then(([, module]) => module.default as KatexRenderer)
  }

  return katexLoader
}

export const preloadMathRichTextRenderer = async (): Promise<void> => {
  await loadKatex()
}

const renderMath = (
  renderer: KatexRenderer | null,
  expression: string,
  displayMode: boolean,
) => {
  if (!renderer) {
    return undefined
  }

  try {
    return renderer.renderToString(expression, {
      displayMode,
      throwOnError: true,
      output: "html",
      strict: "warn",
    })
  } catch {
    return null
  }
}

export function MathRichText({
  content,
  className,
  textClassName,
  inline = false,
}: MathRichTextProps) {
  const [renderer, setRenderer] = useState<KatexRenderer | null>(null)
  const value = content ?? ""

  useEffect(() => {
    let isActive = true

    void loadKatex().then((resolved) => {
      if (isActive) {
        setRenderer(resolved)
      }
    })

    return () => {
      isActive = false
    }
  }, [])

  if (!value.trim()) {
    return null
  }

  const segments = parseMathRichTextSegments(value)

  return (
    <div
      className={joinClasses(
        inline ? "inline" : "",
        className,
      )}
    >
      {segments.map((segment, index) => {
        if (segment.type === "text") {
          return (
            <span
              key={`text-${index}`}
              className={joinClasses(
                "whitespace-pre-wrap",
                textClassName,
              )}
            >
              {segment.value}
            </span>
          )
        }

        const html = renderMath(renderer, segment.value, segment.displayMode)
        if (html === undefined) {
          return (
            <code
              key={`math-loading-${index}`}
              className={joinClasses(
                segment.displayMode
                  ? "my-2 block w-full overflow-x-auto rounded-md bg-slate-100/70 px-1.5 py-1 text-[0.9em] text-slate-700"
                  : "inline-block rounded-md bg-slate-100/70 px-1.5 py-1 text-[0.9em] text-slate-700",
                textClassName,
              )}
            >
              {segment.value}
            </code>
          )
        }

        if (html === null) {
          return (
            <code
              key={`math-${index}`}
              className={joinClasses(
                segment.displayMode
                  ? "my-2 block w-full overflow-x-auto rounded-md bg-amber-100/70 px-1.5 py-1 text-[0.9em] text-amber-900"
                  : "inline-block rounded-md bg-amber-100/70 px-1.5 py-1 text-[0.9em] text-amber-900",
                textClassName,
              )}
            >
              {segment.value}
            </code>
          )
        }

        return (
          <span
            key={`math-${index}`}
            className={joinClasses(
              segment.displayMode
                ? "my-2 block w-full overflow-x-auto py-1"
                : "inline-block",
              textClassName,
            )}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )
      })}
    </div>
  )
}
