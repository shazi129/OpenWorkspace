import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildContentTree } from "../../src/core/content-loader";

const temporaryDirectories: string[] = [];

function createContentRoot(): string {
  const root = mkdtempSync(path.join(tmpdir(), "openworkspace-tree-"));
  temporaryDirectories.push(root);
  return root;
}

function createFile(root: string, relativePath: string): void {
  const filePath = path.join(root, relativePath);
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, "test", "utf8");
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
