import { describe, expect, it, vi } from "vitest";
import {
  isTocMarkerText,
  TOC_METADATA_KEY,
  tocMarkerPlugin,
} from "../../src/markdown/toc-marker";

describe("Markdown [TOC] 标记", () => {
  it("识别独立的 TOC 标记", () => {
    expect(isTocMarkerText(" [TOC] \n")).toBe(true);
    expect(isTocMarkerText("[toc]")).toBe(true);
    expect(isTocMarkerText("正文中的 [TOC] 不应转换")).toBe(false);
  });

  it("移除标记段落并写入渲染元数据", () => {
    const node = { type: "paragraph", children: [] };
    const removeNode = vi.fn();
    const context = {
      data: { astro: { frontmatter: {} } },
      removeNode,
      textContent: () => "[TOC]",
    };

    tocMarkerPlugin.paragraph(node as never, context as never);

    expect(context.data.astro.frontmatter).toEqual({
      [TOC_METADATA_KEY]: true,
    });
    expect(removeNode).toHaveBeenCalledWith(node);
  });
});
