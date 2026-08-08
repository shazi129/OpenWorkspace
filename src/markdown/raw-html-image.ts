import type { SatteriProcessorOptions } from "@astrojs/markdown-satteri";
import { fromHtml } from "hast-util-from-html";

type MdastPlugin = NonNullable<
  SatteriProcessorOptions["mdastPlugins"]
>[number];

export interface RawHtmlImage {
  alt: string;
  properties: Record<string, unknown>;
  src: string;
  title: string | null;
}

export function parseRawHtmlImage(value: string): RawHtmlImage | undefined {
  const root = fromHtml(value, { fragment: true });
  const children = root.children.filter(
    (child) => child.type !== "text" || child.value.trim() !== "",
  );

  if (children.length !== 1) return undefined;

  const image = children[0];
  if (image?.type !== "element" || image.tagName !== "img") {
    return undefined;
  }

  const { src, alt, title, ...rest } = image.properties;
  if (typeof src !== "string" || src.trim() === "") return undefined;

  return {
    src,
    alt: typeof alt === "string" ? alt : "",
    title: typeof title === "string" ? title : null,
    properties: { ...rest },
  };
}

export const rawHtmlImagePlugin = {
  name: "openworkspace-raw-html-image",
  html(node) {
    const image = parseRawHtmlImage(node.value);
    if (!image) return undefined;

    return {
      type: "image",
      url: image.src,
      alt: image.alt,
      title: image.title,
      ...(Object.keys(image.properties).length > 0
        ? { data: { hProperties: image.properties } }
        : {}),
    };
  },
} satisfies MdastPlugin;
