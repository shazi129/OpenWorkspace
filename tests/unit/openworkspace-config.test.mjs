import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  loadOpenWorkspaceConfig,
  resolveDistRoot,
  resolveWorkspaceRoot,
} from "../../src/core/openworkspace-config.mjs";

const temporaryDirectories = [];

function createFrameworkRoot() {
  const root = mkdtempSync(path.join(tmpdir(), "openworkspace-config-"));
  temporaryDirectories.push(root);
  return root;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe("OpenWorkspace 配置", () => {
  it("未配置时使用仓库内置 workspace", () => {
    const frameworkRoot = createFrameworkRoot();

    expect(loadOpenWorkspaceConfig({ frameworkRoot, env: {} })).toEqual({
      distRoot: path.join(frameworkRoot, "dist"),
      frameworkRoot,
      source: "default",
      workspaceRoot: path.join(frameworkRoot, "workspace"),
    });
  });

  it("从根目录配置读取相对 workspace 路径", () => {
    const frameworkRoot = createFrameworkRoot();
    writeFileSync(
      path.join(frameworkRoot, "openworkspace.config.json"),
      JSON.stringify({ workspaceRoot: "../private-workspace" }),
      "utf8",
    );

    expect(resolveWorkspaceRoot({ frameworkRoot, env: {} })).toBe(
      path.resolve(frameworkRoot, "../private-workspace"),
    );
    expect(resolveDistRoot({ frameworkRoot, env: {} })).toBe(
      path.join(frameworkRoot, "dist"),
    );
  });

  it("从根目录配置读取相对 dist 路径", () => {
    const frameworkRoot = createFrameworkRoot();
    writeFileSync(
      path.join(frameworkRoot, "openworkspace.config.json"),
      JSON.stringify({
        workspaceRoot: "../private-workspace",
        distRoot: "../private-workspace/dist",
      }),
      "utf8",
    );

    expect(loadOpenWorkspaceConfig({ frameworkRoot, env: {} })).toMatchObject({
      distRoot: path.resolve(frameworkRoot, "../private-workspace/dist"),
      workspaceRoot: path.resolve(frameworkRoot, "../private-workspace"),
    });
  });

  it("支持绝对 workspace 路径", () => {
    const frameworkRoot = createFrameworkRoot();
    const absoluteWorkspaceRoot = path.resolve(frameworkRoot, "external");
    writeFileSync(
      path.join(frameworkRoot, "openworkspace.config.json"),
      JSON.stringify({ workspaceRoot: absoluteWorkspaceRoot }),
      "utf8",
    );

    expect(resolveWorkspaceRoot({ frameworkRoot, env: {} })).toBe(
      absoluteWorkspaceRoot,
    );
  });

  it("环境变量覆盖根目录配置", () => {
    const frameworkRoot = createFrameworkRoot();
    writeFileSync(
      path.join(frameworkRoot, "openworkspace.config.json"),
      JSON.stringify({ workspaceRoot: "../configured-workspace" }),
      "utf8",
    );

    expect(
      loadOpenWorkspaceConfig({
        frameworkRoot,
        env: { OPENWORKSPACE_WORKSPACE_ROOT: "../environment-workspace" },
      }),
    ).toMatchObject({
      distRoot: path.join(frameworkRoot, "dist"),
      source: "environment",
      workspaceRoot: path.resolve(frameworkRoot, "../environment-workspace"),
    });
  });

  it("拒绝无效配置而不静默回退示例工作区", () => {
    const frameworkRoot = createFrameworkRoot();
    writeFileSync(
      path.join(frameworkRoot, "openworkspace.config.json"),
      JSON.stringify({ workspacePath: "../private-workspace" }),
      "utf8",
    );

    expect(() => resolveWorkspaceRoot({ frameworkRoot, env: {} })).toThrow(
      "未知字段：workspacePath",
    );
  });

  it("拒绝无法解析的配置而不静默回退示例工作区", () => {
    const frameworkRoot = createFrameworkRoot();
    writeFileSync(
      path.join(frameworkRoot, "openworkspace.config.json"),
      "{",
      "utf8",
    );

    expect(() => resolveWorkspaceRoot({ frameworkRoot, env: {} })).toThrow(
      "无法解析 OpenWorkspace 配置文件",
    );
  });

  it("拒绝空的环境变量而不静默回退配置文件", () => {
    const frameworkRoot = createFrameworkRoot();

    expect(() =>
      resolveWorkspaceRoot({
        frameworkRoot,
        env: { OPENWORKSPACE_WORKSPACE_ROOT: " " },
      }),
    ).toThrow("OPENWORKSPACE_WORKSPACE_ROOT 必须是非空路径");
  });

  it("拒绝把 distRoot 指向框架根目录", () => {
    const frameworkRoot = createFrameworkRoot();
    writeFileSync(
      path.join(frameworkRoot, "openworkspace.config.json"),
      JSON.stringify({ workspaceRoot: "./workspace", distRoot: "." }),
      "utf8",
    );

    expect(() => resolveDistRoot({ frameworkRoot, env: {} })).toThrow(
      "distRoot 不能是框架或工作区的根目录/父目录",
    );
  });

  it("拒绝把 distRoot 指向工作区私有目录", () => {
    const frameworkRoot = createFrameworkRoot();
    writeFileSync(
      path.join(frameworkRoot, "openworkspace.config.json"),
      JSON.stringify({
        workspaceRoot: "./workspace",
        distRoot: "./workspace/storage/site",
      }),
      "utf8",
    );

    expect(() => resolveDistRoot({ frameworkRoot, env: {} })).toThrow(
      "distRoot 不能位于源码或私有数据目录内",
    );
  });
});
