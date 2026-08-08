import type { SatteriProcessorOptions } from "@astrojs/markdown-satteri";
import katex from "katex";

type MdastPlugin = NonNullable<
  SatteriProcessorOptions["mdastPlugins"]
>[number];

function originalMarkdown(
  source: string,
  position:
    | { start: { offset?: number }; end: { offset?: number } }
    | undefined,
): string {
  if (
    typeof position?.start.offset !== "number" ||
    typeof position.end.offset !== "number"
  ) {
    return "";
  }

  const bytes = new TextEncoder().encode(source);
  return new TextDecoder().decode(
    bytes.subarray(position.start.offset, position.end.offset),
  );
}

export function normalizeLatex(source: string): string {
  // Legacy Markdown often nests $...$ inside an outer $$...$$ expression.
  // KaTeX is already in math mode here, so the inner delimiters must be removed.
  return source.replace(/[\u200b\ufeff]/gu, "").replace(/(?<!\\)\$/gu, "");
}

export function renderLatex(source: string, displayMode: boolean): string {
  return katex.renderToString(normalizeLatex(source), {
    displayMode,
    output: "htmlAndMathml",
    strict: "ignore",
    throwOnError: false,
  });
}

export const mathRendererPlugin = {
  name: "openworkspace-katex-renderer",
  math(node) {
    return { rawHtml: renderLatex(node.value, true) };
  },
  inlineMath(node, context) {
    const displayMode = originalMarkdown(
      context.source,
      node.position,
    ).startsWith("$$");

    return { rawHtml: renderLatex(node.value, displayMode) };
  },
} satisfies MdastPlugin;
