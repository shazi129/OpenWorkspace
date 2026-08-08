import { markdownToHtml } from "satteri";
import { describe, expect, it } from "vitest";
import {
  parseRawHtmlImage,
  rawHtmlImagePlugin,
} from "../../src/markdown/raw-html-image";

function renderMarkdown(source: string): string {
  return markdownToHtml(source, {
    mdastPlugins: [rawHtmlImagePlugin],
  }).html;
}

describe("Markdown raw HTML images", () => {
  it("parses a standalone image and keeps custom properties", () => {
    expect(
      parseRawHtmlImage(
        '<img src="./持仓.jpg" alt="持仓" title="年度持仓" style="zoom:40%;float:left; margin:10px;" loading="lazy" />',
      ),
    ).toEqual({
      src: "./持仓.jpg",
      alt: "持仓",
      title: "年度持仓",
      properties: {
        style: "zoom:40%;float:left; margin:10px;",
        loading: "lazy",
      },
    });
  });

  it("converts the image to a Markdown image node without losing styles", () => {
    const html = renderMarkdown(
      '<img src="./持仓.jpg" alt="持仓" style="zoom:40%;float:left; margin:10px;" />',
    );

    expect(html).toContain('src="./%E6%8C%81%E4%BB%93.jpg"');
    expect(html).toContain('alt="持仓"');
    expect(html).toContain('style="zoom:40%;float:left; margin:10px;"');
  });

  it("does not rewrite general or mixed HTML fragments", () => {
    expect(parseRawHtmlImage('<div><img src="./image.png"></div>')).toBe(
      undefined,
    );
    expect(parseRawHtmlImage('<img src="./one.png"><span>caption</span>')).toBe(
      undefined,
    );
  });
});
