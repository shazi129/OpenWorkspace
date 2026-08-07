import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import path from "node:path";
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
    order: z.number().int().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { pages };
