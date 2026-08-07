import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadSiteManifest } from "../../src/core/content-loader";

describe("Workspace 设置模块", () => {
  it("作为只能通过 URL 访问的 private 客户端模块生成", () => {
    const repositoryRoot = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../..",
    );
    const manifest = loadSiteManifest(path.join(repositoryRoot, "workspace"));
    const settings = manifest.modules.find((module) => module.id === "settings");

    expect(settings).toMatchObject({
      href: "/settings/",
      order: -1,
      private: true,
      publish: true,
      runtime: "client",
      showDirectoryTree: false,
    });
    expect(
      manifest.modules.filter((module) => !module.private).map((module) => module.id),
    ).not.toContain("settings");
  });
});
