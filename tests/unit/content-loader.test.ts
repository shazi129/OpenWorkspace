import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  buildContentTree,
  getContentIndexRoutePaths,
  getContentRoutePaths,
  getRawAssetRoutePaths,
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
        createTime: "2000-01-01T00:00:00.000Z",
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
  function createModule(
    index?: string | { type: "generated"; pageSize?: number },
  ): string {
    const root = createContentRoot();
    createFile(
      root,
      "config.json",
      JSON.stringify({ defaultModule: "articles" }),
    );
    createFile(
      root,
      "modules/articles/config.json",
      JSON.stringify({
        id: "articles",
        title: "文章",
        ...(index !== undefined ? { index } : {}),
      }),
    );
    createFile(root, "modules/articles/icon.svg", "<svg></svg>");
    return root;
  }

  it("默认读取模块根目录 index.md 且不放入目录树", () => {
    const root = createModule();
    createFile(root, "modules/articles/index.md");
    createFile(root, "modules/articles/content/文章.md");

    const module = loadSiteManifest(root).modules[0];
    expect(module.href).toBe("/articles/");
    expect(module.indexSlug).toBe("");
    expect(module.tree).toEqual([
      expect.objectContaining({ label: "文章", slug: "文章" }),
    ]);
  });

  it("没有配置和 index.md 时自动生成按时间排序的模块首页与索引", () => {
    const root = createModule();
    createFile(
      root,
      "modules/articles/content/近期文章.md",
      "---\ntitle: 最近一篇\ncreate: 2026-08-13 10:00:00\ntags: 技术, Astro\n---\n",
    );
    createFile(root, "modules/articles/content/旧文章.md", "# 旧文章");

    const module = loadSiteManifest(root).modules[0];
    expect(module).toMatchObject({
      href: "/articles/",
      indexMode: "generated",
      indexPageSize: 20,
      indexSlug: "",
    });
    expect(module.contentIndex).toEqual([
      expect.objectContaining({
        title: "最近一篇",
        tags: ["技术", "Astro"],
      }),
      expect.objectContaining({
        create: "2000-01-01T00:00:00.000Z",
        title: "旧文章",
        tags: [],
      }),
    ]);
    expect(getContentRoutePaths(root)).toContainEqual(
      expect.objectContaining({
        params: { module: "articles", slug: undefined },
        props: expect.objectContaining({ kind: "generated-index" }),
      }),
    );
    expect(getContentIndexRoutePaths(root)).toEqual([
      {
        params: { module: "articles" },
        props: { entries: module.contentIndex },
      },
    ]);
  });

  it("显式 generated 配置可以覆盖已有 index.md 并调整分页", () => {
    const root = createModule({ type: "generated", pageSize: 5 });
    createFile(root, "modules/articles/index.md");
    createFile(root, "modules/articles/content/文章.md");

    expect(loadSiteManifest(root).modules[0]).toMatchObject({
      indexMode: "generated",
      indexPageSize: 5,
    });
  });

  it("自动首页索引包含 HTML 并使用文件名、默认时间和空标签", () => {
    const root = createModule();
    createFile(root, "modules/articles/content/小工具.html", "<h1>工具</h1>");

    expect(loadSiteManifest(root).modules[0].contentIndex).toEqual([
      {
        create: "2000-01-01T00:00:00.000Z",
        href: "/articles/%E5%B0%8F%E5%B7%A5%E5%85%B7/",
        kind: "html",
        tags: [],
        title: "小工具",
      },
    ]);
  });

  it("允许只有模块首页且 contentDir 不存在", () => {
    const root = createModule();
    createFile(root, "modules/articles/index.md");

    const module = loadSiteManifest(root).modules[0];
    expect(module.contentFiles).toEqual([
      expect.objectContaining({ href: "/articles/", slug: "" }),
    ]);
    expect(module.tree).toEqual([]);
    expect(
      getRawAssetRoutePaths(root).map((route) => route.params.path),
    ).toEqual(["icon.svg"]);
  });

  it("contentDir 存在时仍要求它是目录", () => {
    const root = createModule();
    createFile(root, "modules/articles/index.md");
    createFile(root, "modules/articles/content");

    expect(() => loadSiteManifest(root)).toThrow("contentDir 必须是目录");
  });

  it("允许把 content 下的内容文件配置为模块首页并定位目录树", () => {
    const root = createModule("content/开始.md");
    createFile(root, "modules/articles/content/开始.md");
    createFile(root, "modules/articles/content/其他.md");

    const module = loadSiteManifest(root).modules[0];
    expect(module.href).toBe("/articles/%E5%BC%80%E5%A7%8B/");
    expect(module.indexSlug).toBe("开始");
    expect(module.tree).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "开始", slug: "开始" }),
      ]),
    );
  });

  it("拒绝 content 根目录中的 index 文件", () => {
    const root = createModule();
    createFile(root, "modules/articles/index.md");
    createFile(root, "modules/articles/content/index.md");

    expect(() => loadSiteManifest(root)).toThrow(
      "contentDir 根目录不能包含 index 文件",
    );
  });

  it("按创建时间从近到远排序并以最早文章时间作为目录时间", () => {
    const root = createContentRoot();
    const markdown = (createTime?: string) =>
      createTime
        ? `---\ncreate: ${createTime}\n---\n\n# 正文`
        : "# 正文";

    createFile(root, "近期文章.md", markdown("2025-01-01 00:00:00"));
    createFile(root, "较早文章.md", markdown("2020-01-01 00:00:00"));
    createFile(root, "历史目录/目录中的新文章.md", markdown("2024-01-01"));
    createFile(root, "历史目录/目录中的最早文章.md", markdown("2010-01-01"));
    createFile(root, "未标时间.md", markdown());

    const tree = buildContentTree(root, "articles");

    expect(tree.map((node) => node.label)).toEqual([
      "近期文章",
      "较早文章",
      "历史目录",
      "未标时间",
    ]);
    expect(tree[2]).toMatchObject({
      createTime: "2010-01-01T00:00:00.000Z",
      kind: "directory",
      children: [
        expect.objectContaining({ label: "目录中的新文章" }),
        expect.objectContaining({ label: "目录中的最早文章" }),
      ],
    });
  });
});

describe("模块导航排序", () => {
  it("正数从顶部递增，负数按从底部的距离排列", () => {
    const root = createContentRoot();
    createFile(
      root,
      "config.json",
      JSON.stringify({ defaultModule: "top-one" }),
    );

    for (const [id, title, order] of [
      ["bottom-one", "底部第一", -1],
      ["top-two", "顶部第二", 2],
      ["bottom-three", "底部第三", -3],
      ["top-one", "顶部第一", 1],
      ["bottom-two", "底部第二", -2],
    ] as const) {
      createFile(
        root,
        `modules/${id}/config.json`,
        JSON.stringify({ id, title, order }),
      );
      createFile(root, `modules/${id}/icon.svg`, "<svg></svg>");
      createFile(root, `modules/${id}/index.md`);
      createFile(root, `modules/${id}/content/内容.md`);
    }

    expect(loadSiteManifest(root).modules.map((module) => module.id)).toEqual([
      "top-one",
      "top-two",
      "bottom-three",
      "bottom-two",
      "bottom-one",
    ]);
  });
});

describe("模块发布控制", () => {
  function createPublishedModule(
    root: string,
    id: string,
    config: Record<string, unknown> = {},
  ): void {
    createFile(
      root,
      `modules/${id}/config.json`,
      JSON.stringify({ id, title: id, ...config }),
    );
    createFile(root, `modules/${id}/icon.svg`, "<svg></svg>");
    createFile(root, `modules/${id}/index.md`);
    createFile(root, `modules/${id}/content/内容.md`);
  }

  it("保留 private 模块供 URL 访问，并排除 publish false 模块", () => {
    const root = createContentRoot();
    createFile(
      root,
      "config.json",
      JSON.stringify({ defaultModule: "articles" }),
    );
    createPublishedModule(root, "articles");
    createPublishedModule(root, "private-tools", { private: true });
    createFile(
      root,
      "modules/unpublished/config.json",
      JSON.stringify({
        id: "unpublished",
        title: "unpublished",
        publish: false,
      }),
    );

    const modules = loadSiteManifest(root).modules;
    expect(modules.map((module) => module.id)).toEqual([
      "articles",
      "private-tools",
    ]);
    expect(modules.find((module) => module.id === "private-tools")).toMatchObject({
      href: "/private-tools/",
      private: true,
      publish: true,
    });
    expect(
      getContentRoutePaths(root).some(
        (route) => route.params.module === "private-tools",
      ),
    ).toBe(true);
    expect(
      getContentRoutePaths(root).some(
        (route) => route.params.module === "unpublished",
      ),
    ).toBe(false);
    expect(
      getRawAssetRoutePaths(root).some(
        (route) => route.params.module === "unpublished",
      ),
    ).toBe(false);
    expect(
      getContentIndexRoutePaths(root).map((route) => route.params.module),
    ).toEqual(["articles", "private-tools"]);
  });
});
