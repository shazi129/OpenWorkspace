import { describe, expect, it } from "vitest";
import { parseGlobalConfig, parseModuleConfig } from "../../src/core/config-schema";

describe("配置校验", () => {
  it("为可选的模块配置提供默认值", () => {
    const config = parseModuleConfig({ id: "articles", title: "文章" });

    expect(config).toMatchObject({
      access: "public",
      contentDir: "./content",
      icon: "./icon.svg",
      order: 100,
      private: false,
      publish: true,
      runtime: "static",
      showDirectoryTree: false,
    });
    expect(config.index).toBeUndefined();
  });

  it("支持生成式模块首页及分页大小", () => {
    expect(
      parseModuleConfig({
        id: "articles",
        title: "文章",
        index: { type: "generated" },
      }),
    ).toMatchObject({
      index: { type: "generated", pageSize: 20 },
    });

    expect(() =>
      parseModuleConfig({
        id: "articles",
        title: "文章",
        index: { type: "generated", pageSize: 0 },
      }),
    ).toThrow();
  });

  it("要求 server 模块提供服务入口", () => {
    expect(() =>
      parseModuleConfig({
        id: "stocks",
        title: "股票",
        runtime: "server",
      }),
    ).toThrow();

    expect(
      parseModuleConfig({
        id: "stocks",
        title: "股票",
        runtime: "server",
        serverEntry: "./server/index.mjs",
      }),
    ).toMatchObject({ runtime: "server", serverEntry: "./server/index.mjs" });
  });

  it("拒绝可能逃逸模块目录的绝对路径", () => {
    expect(() =>
      parseModuleConfig({
        id: "articles",
        title: "文章",
        contentDir: "C:\\private",
      }),
    ).toThrow();
  });

  it("拒绝没有上下对齐语义的 order 0", () => {
    expect(() =>
      parseModuleConfig({ id: "articles", title: "文章", order: 0 }),
    ).toThrow("order 不能为 0");
  });

  it("要求配置唯一的默认模块", () => {
    expect(parseGlobalConfig({ defaultModule: "introduction" })).toMatchObject({
      defaultModule: "introduction",
      title: "OpenWorkspace",
    });
  });
});
