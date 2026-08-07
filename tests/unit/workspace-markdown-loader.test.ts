import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { LoaderContext } from "astro/loaders";
import { afterEach, describe, expect, it } from "vitest";
import { workspaceMarkdownLoader } from "../../src/markdown/workspace-markdown-loader";

const temporaryDirectories: string[] = [];

function createFile(root: string, relativePath: string, content = ""): void {
  const filePath = path.join(root, relativePath);
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, "utf8");
}

function createWorkspace(): string {
  const root = mkdtempSync(path.join(tmpdir(), "openworkspace-markdown-"));
  temporaryDirectories.push(root);
  createFile(root, "config.json", JSON.stringify({ defaultModule: "articles" }));
  createFile(
    root,
    "modules/articles/config.json",
    JSON.stringify({ id: "articles", title: "文章" }),
  );
  createFile(root, "modules/articles/icon.svg", "<svg></svg>");
  createFile(root, "modules/articles/index.md", "# 首页");
  createFile(
    root,
    "modules/articles/content/C# 指南.md",
    "---\ntitle: C# 指南\n---\n\n# 正文",
  );
  return root;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe("Workspace Markdown loader", () => {
  it("读取包含 # 的文件路径并保留 entry id", async () => {
    const workspaceRoot = createWorkspace();
    const storedEntries: Array<Record<string, unknown>> = [];
    const renderedFileUrls: URL[] = [];
    const loader = workspaceMarkdownLoader({ workspaceRoot });
    const context = {
      config: { root: pathToFileURL(`${workspaceRoot}${path.sep}`) },
      generateDigest: (contents: string) => contents.length,
      parseData: async ({ data }: { data: Record<string, unknown> }) => data,
      renderMarkdown: async (_contents: string, options?: { fileURL?: URL }) => {
        if (options?.fileURL) renderedFileUrls.push(options.fileURL);
        return {
          html: "<h1>正文</h1>",
          metadata: { frontmatter: { title: "C# 指南" }, imagePaths: [] },
        };
      },
      store: {
        clear: () => storedEntries.splice(0),
        set: (entry: Record<string, unknown>) => {
          storedEntries.push(entry);
          return true;
        },
      },
    } as unknown as LoaderContext;

    await loader.load(context);

    expect(storedEntries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "articles/content/C# 指南",
          data: { title: "C# 指南" },
          filePath: expect.stringContaining("C%23%20%E6%8C%87%E5%8D%97.md"),
        }),
      ]),
    );
    expect(
      renderedFileUrls.some(
        (url) =>
          url.href.includes("C%23") &&
          decodeURIComponent(url.pathname).endsWith("/C# 指南.md"),
      ),
    ).toBe(true);
  });
});
