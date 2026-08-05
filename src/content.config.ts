import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const pages = defineCollection({
  loader: glob({
    base: "./data",
    pattern: "*/**/*.md",
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
