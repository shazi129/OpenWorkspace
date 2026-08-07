import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadSiteManifest } from "../../src/core/content-loader";

describe("Workspace 设置模块", () => {
  it("作为 -1 客户端模块固定在导航底部", () => {
    const repositoryRoot = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../..",
    );
    const manifest = loadSiteManifest(path.join(repositoryRoot, "workspace"));
    const settings = manifest.modules.find((module) => module.id === "settings");

    expect(settings).toMatchObject({
      href: "/settings/",
      order: -1,
      runtime: "client",
      showDirectoryTree: false,
    });
    expect(manifest.modules.at(-1)?.id).toBe("settings");
  });
});
