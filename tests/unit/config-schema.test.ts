import { describe, expect, it } from "vitest";
import { parseGlobalConfig, parseModuleConfig } from "../../src/core/config-schema";

describe("配置校验", () => {
  it("为可选的模块配置提供默认值", () => {
    const config = parseModuleConfig({ id: "articles", title: "文章" });

    expect(config).toMatchObject({
      access: "public",
      contentDir: "./content",
      icon: "./icon.svg",
      index: "index.md",
      order: 100,
      showDirectoryTree: false,
    });
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

  it("要求配置唯一的默认模块", () => {
    expect(parseGlobalConfig({ defaultModule: "introduction" })).toMatchObject({
      defaultModule: "introduction",
      title: "OpenWorkspace",
    });
  });
});

