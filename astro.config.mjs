import { satteri } from "@astrojs/markdown-satteri";
import { defineConfig } from "astro/config";
import {
  resolveDistRoot,
  resolveThemePath,
} from "./src/core/openworkspace-config.mjs";
import { mathRendererPlugin } from "./src/markdown/math-renderer";
import { rawHtmlImagePlugin } from "./src/markdown/raw-html-image";
import { tocMarkerPlugin } from "./src/markdown/toc-marker";

export default defineConfig({
  outDir: resolveDistRoot(),
  markdown: {
    processor: satteri({
      features: { math: true },
      mdastPlugins: [
        tocMarkerPlugin,
        mathRendererPlugin,
        rawHtmlImagePlugin,
      ],
    }),
  },
  output: "static",
  trailingSlash: "ignore",
  vite: {
    resolve: {
      alias: {
        "@openworkspace-theme": resolveThemePath(),
      },
    },
  },
});
