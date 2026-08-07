import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { Loader, LoaderContext } from "astro/loaders";
import { loadSiteManifest } from "../core/content-loader";

interface WorkspaceMarkdownLoaderOptions {
  workspaceRoot: string;
}

interface MarkdownSource {
  absolutePath: string;
  id: string;
}

function toPosix(filePath: string): string {
  return filePath.replaceAll(path.sep, "/");
}

function encodeRelativeFilePath(filePath: string): string {
  return toPosix(filePath)
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function markdownBody(source: string): string {
  const frontmatter = /^(?:\uFEFF)?---[\t ]*\r?\n[\s\S]*?\r?\n(?:---|\.\.\.)[\t ]*(?:\r?\n|$)/;
  return source.replace(frontmatter, "");
}

function markdownSources(workspaceRoot: string): MarkdownSource[] {
  return loadSiteManifest(workspaceRoot).modules.flatMap((module) =>
    module.contentFiles.flatMap((file) => {
      if (file.kind !== "markdown") return [];
      if (!file.entryId) {
        throw new Error(`Markdown 内容缺少 entryId：${file.absolutePath}`);
      }
      return [{ absolutePath: file.absolutePath, id: file.entryId }];
    }),
  );
}

function frontmatterData(rendered: Awaited<ReturnType<LoaderContext["renderMarkdown"]>>) {
  const frontmatter = rendered.metadata?.frontmatter;
  return frontmatter && typeof frontmatter === "object" && !Array.isArray(frontmatter)
    ? frontmatter
    : {};
}

async function loadMarkdownSources(
  workspaceRoot: string,
  context: LoaderContext,
): Promise<void> {
  const projectRoot = fileURLToPath(context.config.root);
  const entries = await Promise.all(
    markdownSources(workspaceRoot).map(async ({ absolutePath, id }) => {
      const contents = await readFile(absolutePath, "utf8");
      const fileUrl = pathToFileURL(absolutePath);
      const filePath = encodeRelativeFilePath(
        path.relative(projectRoot, absolutePath),
      );
      const rendered = await context.renderMarkdown(contents, {
        fileURL: fileUrl,
      });
      const data = await context.parseData({
        data: frontmatterData(rendered),
        filePath: absolutePath,
        id,
      });

      return {
        assetImports: rendered.metadata?.imagePaths,
        body: markdownBody(contents),
        data,
        digest: context.generateDigest(contents),
        filePath,
        id,
        rendered,
      };
    }),
  );

  context.store.clear();
  for (const entry of entries) context.store.set(entry);
}

function isWorkspaceInput(filePath: string, modulesRoot: string): boolean {
  const relativePath = path.relative(modulesRoot, path.resolve(filePath));
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) return false;
  return (
    path.extname(relativePath).toLowerCase() === ".md" ||
    path.basename(relativePath).toLowerCase() === "config.json"
  );
}

export function workspaceMarkdownLoader({
  workspaceRoot,
}: WorkspaceMarkdownLoaderOptions): Loader {
  const modulesRoot = path.join(workspaceRoot, "modules");

  return {
    name: "openworkspace-markdown-loader",
    async load(context) {
      await loadMarkdownSources(workspaceRoot, context);

      if (!context.watcher) return;
      context.watcher.add(modulesRoot);

      let reloadTimer: ReturnType<typeof setTimeout> | undefined;
      const queueReload = (changedPath: string) => {
        if (!isWorkspaceInput(changedPath, modulesRoot)) return;
        if (reloadTimer) clearTimeout(reloadTimer);
        reloadTimer = setTimeout(() => {
          void loadMarkdownSources(workspaceRoot, context)
            .then(() => context.logger.info("已重新加载 workspace Markdown"))
            .catch((error: unknown) => {
              context.logger.error(
                error instanceof Error ? error.message : String(error),
              );
            });
        }, 50);
      };

      context.watcher.on("add", queueReload);
      context.watcher.on("change", queueReload);
      context.watcher.on("unlink", queueReload);
    },
  };
}
