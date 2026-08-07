import { satteri } from "@astrojs/markdown-satteri";
import { defineConfig } from "astro/config";
import { tocMarkerPlugin } from "./src/markdown/toc-marker";

export default defineConfig({
  markdown: {
    processor: satteri({
      mdastPlugins: [tocMarkerPlugin],
    }),
  },
  output: "static",
  trailingSlash: "always",
});
