import { z } from "zod";

const relativePathSchema = z
  .string()
  .min(1)
  .refine((value) => !value.includes("\0"), "路径不能包含空字符")
  .refine((value) => !/^(?:[a-zA-Z]:[\\/]|[\\/])/.test(value), "路径必须是相对路径");

export const globalConfigSchema = z
  .object({
    title: z.string().min(1).default("OpenWorkspace"),
    description: z.string().default(""),
    defaultModule: z.string().min(1),
  })
  .strict();

export const moduleConfigSchema = z
  .object({
    id: z
      .string()
      .min(1)
      .regex(/^[a-z0-9][a-z0-9-]*$/, "模块 id 只能包含小写字母、数字和连字符"),
    title: z.string().min(1),
    order: z.number().int().default(100),
    access: z.enum(["public", "authenticated", "allowlist"]).default("public"),
    icon: relativePathSchema.default("./icon.svg"),
    contentDir: relativePathSchema.default("./content"),
    showDirectoryTree: z.boolean().default(false),
    index: relativePathSchema.default("index.md"),
    runtime: z.enum(["static", "client", "server"]).default("static"),
    serverEntry: relativePathSchema.optional(),
  })
  .strict()
  .superRefine((config, context) => {
    if (config.runtime === "server" && !config.serverEntry) {
      context.addIssue({
        code: "custom",
        message: "runtime 为 server 时必须配置 serverEntry",
        path: ["serverEntry"],
      });
    }
    if (config.runtime !== "server" && config.serverEntry) {
      context.addIssue({
        code: "custom",
        message: "只有 server 模块可以配置 serverEntry",
        path: ["serverEntry"],
      });
    }
  });

export type GlobalConfig = z.infer<typeof globalConfigSchema>;
export type ModuleConfig = z.infer<typeof moduleConfigSchema>;

export function parseGlobalConfig(input: unknown): GlobalConfig {
  return globalConfigSchema.parse(input);
}

export function parseModuleConfig(input: unknown): ModuleConfig {
  return moduleConfigSchema.parse(input);
}
