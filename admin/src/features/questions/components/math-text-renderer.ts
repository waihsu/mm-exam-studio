export type KatexRenderer = {
  renderToString: (
    expression: string,
    options: {
      displayMode: boolean;
      throwOnError: boolean;
      output: "html";
      strict: "warn";
    },
  ) => string;
};

let katexLoader: Promise<KatexRenderer> | null = null;

export const loadMathTextRenderer = async (): Promise<KatexRenderer> => {
  if (!katexLoader) {
    katexLoader = Promise.all([
      import("katex/dist/katex.min.css"),
      import("katex"),
    ]).then(([, module]) => module.default as KatexRenderer);
  }

  return katexLoader;
};

export const preloadMathTextRenderer = async (): Promise<void> => {
  await loadMathTextRenderer();
};
