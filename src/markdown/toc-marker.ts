import type { SatteriProcessorOptions } from "@astrojs/markdown-satteri";

type MdastPlugin = NonNullable<
  SatteriProcessorOptions["mdastPlugins"]
>[number];

export const TOC_METADATA_KEY = "openWorkspaceToc";

export function isTocMarkerText(value: string): boolean {
  return value.trim().toUpperCase() === "[TOC]";
}

export const tocMarkerPlugin = {
  name: "openworkspace-toc-marker",
  paragraph(node, context) {
    if (!isTocMarkerText(context.textContent(node))) return;

    const astroData = context.data.astro;
    if (!astroData) return;

    astroData.frontmatter[TOC_METADATA_KEY] = true;
    context.removeNode(node);
  },
} satisfies MdastPlugin;
