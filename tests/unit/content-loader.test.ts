import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  buildContentTree,
  loadSiteManifest,
} from "../../src/core/content-loader";

const temporaryDirectories: string[] = [];

function createContentRoot(): string {
  const root = mkdtempSync(path.join(tmpdir(), "openworkspace-tree-"));
  temporaryDirectories.push(root);
  return root;
}

function createFile(root: string, relativePath: string, content = "test"): void {
  const filePath = path.join(root, relativePath);
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, "utf8");
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe("内容目录树", () => {
  it("省略只包含一个内容文件的目录", () => {
    const root = createContentRoot();
    createFile(root, "单文件目录/文章.md");
    createFile(root, "单文件目录/配图.png");

    expect(buildContentTree(root, "articles")).toEqual([
      {
        href: "/articles/%E5%8D%95%E6%96%87%E4%BB%B6%E7%9B%AE%E5%BD%95/%E6%96%87%E7%AB%A0/",
        kind: "markdown",
        label: "文章",
        slug: "单文件目录/文章",
      },
    ]);
  });

  it("递归省略通向唯一内容文件的目录", () => {
    const root = createContentRoot();
    createFile(root, "外层/内层/唯一内容.html");

    expect(buildContentTree(root, "articles")).toMatchObject([
      {
        kind: "html",
        label: "唯一内容",
        slug: "外层/内层/唯一内容",
      },
    ]);
  });

  it("保留包含多个内容文件的目录", () => {
    const root = createContentRoot();
    createFile(root, "多文件目录/第一篇.md");
    createFile(root, "多文件目录/第二篇.html");

    expect(buildContentTree(root, "articles")).toMatchObject([
      {
        kind: "directory",
        label: "多文件目录",
        children: expect.arrayContaining([
          expect.objectContaining({ kind: "markdown", label: "第一篇" }),
          expect.objectContaining({ kind: "html", label: "第二篇" }),
        ]),
      },
    ]);
  });
});

describe("模块首页", () => {
  function createModule(index?: string): string {
    const root = createContentRoot();
    createFile(
      root,
      "config.json",
      JSON.stringify({ defaultModule: "articles" }),
    );
    createFile(
      root,
      "articles/config.json",
      JSON.stringify({
        id: "articles",
        title: "文章",
        ...(index ? { index } : {}),
      }),
    );
    createFile(root, "articles/icon.svg", "<svg></svg>");
    return root;
  }

  it("默认读取模块根目录 index.md 且不放入目录树", () => {
    const root = createModule();
    createFile(root, "articles/index.md");
    createFile(root, "articles/content/文章.md");

    const module = loadSiteManifest(root).modules[0];
    expect(module.href).toBe("/articles/");
    expect(module.indexSlug).toBe("");
    expect(module.tree).toEqual([
      expect.objectContaining({ label: "文章", slug: "文章" }),
    ]);
  });

  it("允许把 content 下的内容文件配置为模块首页并定位目录树", () => {
    const root = createModule("content/开始.md");
    createFile(root, "articles/content/开始.md");
    createFile(root, "articles/content/其他.md");

    const module = loadSiteManifest(root).modules[0];
    expect(module.href).toBe("/articles/%E5%BC%80%E5%A7%8B/");
    expect(module.indexSlug).toBe("开始");
    expect(module.tree).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "开始", slug: "开始" }),
      ]),
    );
  });

  it("拒绝 content 根目录中的 index.md", () => {
    const root = createModule();
    createFile(root, "articles/index.md");
    createFile(root, "articles/content/index.md");

    expect(() => loadSiteManifest(root)).toThrow(
      "contentDir 根目录不能包含 index.md",
    );
  });
});
