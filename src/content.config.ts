import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { loadSiteManifest } from "./core/content-loader";

const workspaceRoot = path.resolve(
  process.env.OPENWORKSPACE_WORKSPACE_ROOT ??
    path.join(process.cwd(), "workspace"),
);
const publishedMarkdownPatterns = loadSiteManifest(workspaceRoot).modules.map(
  (module) => `${module.id}/**/*.md`,
);

const pages = defineCollection({
  loader: glob({
    base: pathToFileURL(path.join(workspaceRoot, "modules")),
    pattern: publishedMarkdownPatterns,
    generateId: ({ entry }) =>
      entry.replaceAll("\\", "/").replace(/\.md$/i, ""),
  }),
  schema: z.looseObject({
    title: z.string().optional(),
    description: z.string().optional(),
    order: z.number().int().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { pages };
