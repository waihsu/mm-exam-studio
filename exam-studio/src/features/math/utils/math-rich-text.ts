import katex from "katex";

export type MathSegment =
  | { type: "text"; value: string }
  | { type: "math"; value: string; displayMode: boolean };

const SUPERSCRIPT_MAP: Record<string, string> = {
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
  "+": "⁺",
  "-": "⁻",
  "=": "⁼",
  "(": "⁽",
  ")": "⁾",
  "n": "ⁿ",
  "i": "ⁱ",
};

const SUBSCRIPT_MAP: Record<string, string> = {
  "0": "₀",
  "1": "₁",
  "2": "₂",
  "3": "₃",
  "4": "₄",
  "5": "₅",
  "6": "₆",
  "7": "₇",
  "8": "₈",
  "9": "₉",
  "+": "₊",
  "-": "₋",
  "=": "₌",
  "(": "₍",
  ")": "₎",
};

const MATH_SEGMENT_PATTERN = /(\$\$[\s\S]+?\$\$|\$[^$\n]+\$)/g;

export const parseMathSegments = (content: string): MathSegment[] => {
  const segments: MathSegment[] = [];
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

  return segments.length > 0 ? segments : [{ type: "text", value: content }];
};

export const hasMathSegments = (content?: string | null) =>
  Boolean(content && parseMathSegments(content).some((segment) => segment.type === "math"));

const mapScriptCharacters = (
  value: string,
  table: Record<string, string>,
  fallbackPrefix: string,
) => {
  const mapped = Array.from(value).map((char) => table[char] ?? "").join("");
  if (mapped.length === value.length) {
    return mapped;
  }

  return `${fallbackPrefix}(${value})`;
};

export const normalizeMathForNativeText = (value: string) =>
  value
    .replace(/\\left|\\right/g, "")
    .replace(/\\times/g, "×")
    .replace(/\\div/g, "÷")
    .replace(/\\cdot/g, "·")
    .replace(/\\pm/g, "±")
    .replace(/\\neq/g, "≠")
    .replace(/\\leq/g, "≤")
    .replace(/\\geq/g, "≥")
    .replace(/\\approx/g, "≈")
    .replace(/\\to|\\rightarrow/g, "→")
    .replace(/\\leftarrow/g, "←")
    .replace(/\\pi/g, "π")
    .replace(/\\theta/g, "θ")
    .replace(/\\alpha/g, "α")
    .replace(/\\beta/g, "β")
    .replace(/\\gamma/g, "γ")
    .replace(/\\delta/g, "δ")
    .replace(/\\lambda/g, "λ")
    .replace(/\\mu/g, "μ")
    .replace(/\\sigma/g, "σ")
    .replace(/\\omega/g, "ω")
    .replace(/\\sin/g, "sin")
    .replace(/\\cos/g, "cos")
    .replace(/\\tan/g, "tan")
    .replace(/\\log/g, "log")
    .replace(/\\ln/g, "ln")
    .replace(/\\circ/g, "°")
    .replace(/\\sqrt\{([^}]+)\}/g, "√($1)")
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)")
    .replace(/\^\{([^}]+)\}/g, (_, exponent: string) =>
      mapScriptCharacters(exponent, SUPERSCRIPT_MAP, "^"),
    )
    .replace(/\^([A-Za-z0-9+\-=()])/g, (_, exponent: string) =>
      mapScriptCharacters(exponent, SUPERSCRIPT_MAP, "^"),
    )
    .replace(/_\{([^}]+)\}/g, (_, subscript: string) =>
      mapScriptCharacters(subscript, SUBSCRIPT_MAP, "_"),
    )
    .replace(/_([A-Za-z0-9+\-=()])/g, (_, subscript: string) =>
      mapScriptCharacters(subscript, SUBSCRIPT_MAP, "_"),
    )
    .replace(/\\,/g, " ")
    .replace(/\\+/g, "")
    .replace(/[{}]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const px = (value: string | number | undefined, fallback: number) => {
  if (typeof value === "number") {
    return `${value}px`;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  return `${fallback}px`;
};

type BuildMathDocumentOptions = {
  textColor?: string;
  fontSize?: number | string;
  lineHeight?: number | string;
  inline?: boolean;
};

const renderMathSegment = (value: string, displayMode: boolean) => {
  try {
    return katex.renderToString(value, {
      displayMode,
      output: "mathml",
      strict: "warn",
      throwOnError: true,
    });
  } catch {
    return `<code class="${displayMode ? "math-block-fallback" : "math-inline-fallback"}">${escapeHtml(value)}</code>`;
  }
};

export const buildMathHtmlDocument = (
  content: string,
  options: BuildMathDocumentOptions = {},
) => {
  const segments = parseMathSegments(content);
  const textColor = options.textColor ?? "#1E293B";
  const fontSize = px(options.fontSize, 15);
  const lineHeight = px(options.lineHeight, 22);
  const inline = options.inline ?? false;

  const html = segments
    .map((segment) => {
      if (segment.type === "text") {
        return inline
          ? `<span class="text inline-text">${escapeHtml(segment.value)}</span>`
          : `<div class="text block-text">${escapeHtml(segment.value)}</div>`;
      }

      return segment.displayMode
        ? `<div class="math-block">${renderMathSegment(segment.value, true)}</div>`
        : `<span class="math-inline">${renderMathSegment(segment.value, false)}</span>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <style>
      :root {
        color-scheme: light;
      }
      html, body {
        margin: 0;
        padding: 0;
        background: transparent;
        color: ${textColor};
        font-size: ${fontSize};
        line-height: ${lineHeight};
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        overflow-x: hidden;
      }
      body {
        display: ${inline ? "inline-flex" : "block"};
        flex-wrap: wrap;
        align-items: ${inline ? "center" : "stretch"};
        gap: ${inline ? "4px" : "8px"};
      }
      .text {
        white-space: pre-wrap;
        word-break: break-word;
      }
      .inline-text {
        display: inline;
      }
      .block-text {
        display: block;
      }
      .math-inline {
        display: inline-flex;
        align-items: center;
        min-height: 1.35em;
      }
      .math-block {
        display: block;
        overflow-x: auto;
        padding: 4px 0;
      }
      .math-inline-fallback, .math-block-fallback {
        background: rgba(224, 234, 255, 0.9);
        border-radius: 8px;
        color: #1d4ed8;
        display: inline-block;
        font-family: Menlo, Monaco, monospace;
        font-size: 0.92em;
        padding: 4px 7px;
      }
      .math-block-fallback {
        display: block;
        white-space: pre-wrap;
      }
    </style>
  </head>
  <body>
    ${html}
    <script>
      (function () {
        function sendHeight() {
          if (!window.ReactNativeWebView) return;
          var root = document.documentElement;
          var body = document.body;
          var height = Math.max(
            root ? root.scrollHeight : 0,
            body ? body.scrollHeight : 0,
            root ? root.offsetHeight : 0,
            body ? body.offsetHeight : 0
          );
          window.ReactNativeWebView.postMessage(String(Math.ceil(height || 1)));
        }
        window.addEventListener("load", function () {
          sendHeight();
          setTimeout(sendHeight, 40);
          setTimeout(sendHeight, 160);
        });
        if (typeof ResizeObserver === "function") {
          var observer = new ResizeObserver(sendHeight);
          observer.observe(document.body);
        }
      })();
    </script>
  </body>
</html>`;
};
