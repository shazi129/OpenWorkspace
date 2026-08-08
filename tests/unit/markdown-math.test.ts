import { markdownToHtml } from "satteri";
import { describe, expect, it } from "vitest";
import {
  mathRendererPlugin,
  normalizeLatex,
} from "../../src/markdown/math-renderer";

function renderMarkdown(source: string): string {
  return markdownToHtml(source, {
    features: { math: true },
    mdastPlugins: [mathRendererPlugin],
  }).html;
}

describe("Markdown LaTeX rendering", () => {
  it("renders inline and display formulas with KaTeX", () => {
    const html = renderMarkdown(
      "Inline $E=mc^2$.\n\n$$\n\\int_0^1 x^2 \\, dx\n$$",
    );

    expect(html).toContain('class="katex"');
    expect(html).toContain('class="katex-display"');
    expect(html).toContain("<math");
    expect(html).not.toContain("language-math");
  });

  it("keeps fenced math code as a code block", () => {
    const html = renderMarkdown("```math\nE=mc^2\n```");

    expect(html).toContain("language-math");
    expect(html).not.toContain('class="katex"');
  });

  it("treats same-line double-dollar syntax as display math", () => {
    const html = renderMarkdown("Before $$x^2$$ after");

    expect(html).toContain('class="katex-display"');
  });

  it("normalizes legacy nested delimiters and invisible characters", () => {
    expect(normalizeLatex("\\mbox{$p_n > 0$}\u200b")).toBe(
      "\\mbox{p_n > 0}",
    );
  });
});
