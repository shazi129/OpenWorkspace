import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import path from "node:path";
import { normalizeContentTags } from "./core/content-metadata";
import { workspaceMarkdownLoader } from "./markdown/workspace-markdown-loader";

const workspaceRoot = path.resolve(
  process.env.OPENWORKSPACE_WORKSPACE_ROOT ??
    path.join(process.cwd(), "workspace"),
);

const pages = defineCollection({
  loader: workspaceMarkdownLoader({ workspaceRoot }),
  schema: z.looseObject({
    title: z.string().optional(),
    description: z.string().optional(),
    create: z.coerce.date().optional(),
    tags: z.preprocess(
      (value) => {
        try {
          return normalizeContentTags(value);
        } catch {
          return value;
        }
      },
      z.array(z.string().min(1)).min(1),
    ),
    order: z.number().int().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { pages };
