import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  loadOpenWorkspaceConfig,
  resolveDistRoot,
  resolveTheme,
  resolveThemePath,
  resolveWorkspaceRoot,
} from "../../src/core/openworkspace-config.mjs";

const temporaryDirectories = [];

function createFrameworkRoot() {
  const root = mkdtempSync(path.join(tmpdir(), "openworkspace-config-"));
  temporaryDirectories.push(root);
  createTheme(root, "normal");
  return root;
}

function createTheme(root, name) {
  const themeRoot = path.join(root, "themes", name);
  mkdirSync(themeRoot, { recursive: true });
  writeFileSync(path.join(themeRoot, "theme.css"), ":root {}\n", "utf8");
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
      theme: "normal",
      themePath: path.join(frameworkRoot, "themes", "normal", "theme.css"),
      workspaceRoot: path.join(frameworkRoot, "workspace"),
    });
  });

  it("从根目录配置读取相对 workspace 路径", () => {
    const frameworkRoot = createFrameworkRoot();
    const workspaceRoot = path.join(frameworkRoot, "private-workspace");
    mkdirSync(workspaceRoot);
    writeFileSync(
      path.join(frameworkRoot, "openworkspace.config.json"),
      JSON.stringify({ workspaceRoot: "./private-workspace" }),
      "utf8",
    );

    expect(resolveWorkspaceRoot({ frameworkRoot, env: {} })).toBe(
      workspaceRoot,
    );
    expect(resolveDistRoot({ frameworkRoot, env: {} })).toBe(
      path.join(frameworkRoot, "dist"),
    );
  });

  it("从根目录配置读取相对 dist 路径", () => {
    const frameworkRoot = createFrameworkRoot();
    const workspaceRoot = path.join(frameworkRoot, "private-workspace");
    mkdirSync(workspaceRoot);
    writeFileSync(
      path.join(frameworkRoot, "openworkspace.config.json"),
      JSON.stringify({
        workspaceRoot: "./private-workspace",
        distRoot: "./private-workspace/dist",
      }),
      "utf8",
    );

    expect(loadOpenWorkspaceConfig({ frameworkRoot, env: {} })).toMatchObject({
      distRoot: path.join(workspaceRoot, "dist"),
      workspaceRoot,
    });
  });

  it("配置的 workspace 不存在时回退到仓库内置 workspace", () => {
    const frameworkRoot = createFrameworkRoot();
    mkdirSync(path.join(frameworkRoot, "workspace"));
    createTheme(frameworkRoot, "dark");
    writeFileSync(
      path.join(frameworkRoot, "openworkspace.config.json"),
      JSON.stringify({
        workspaceRoot: "../missing-workspace",
        distRoot: "./site-output",
        theme: "dark",
      }),
      "utf8",
    );

    expect(loadOpenWorkspaceConfig({ frameworkRoot, env: {} })).toMatchObject({
      distRoot: path.join(frameworkRoot, "site-output"),
      source: "default",
      theme: "dark",
      workspaceRoot: path.join(frameworkRoot, "workspace"),
    });
  });

  it("配置的 workspace 不是目录时回退到仓库内置 workspace", () => {
    const frameworkRoot = createFrameworkRoot();
    mkdirSync(path.join(frameworkRoot, "workspace"));
    writeFileSync(path.join(frameworkRoot, "not-a-directory"), "", "utf8");
    writeFileSync(
      path.join(frameworkRoot, "openworkspace.config.json"),
      JSON.stringify({ workspaceRoot: "./not-a-directory" }),
      "utf8",
    );

    expect(resolveWorkspaceRoot({ frameworkRoot, env: {} })).toBe(
      path.join(frameworkRoot, "workspace"),
    );
  });

  it("默认使用 normal 并允许从根目录配置选择主题", () => {
    const frameworkRoot = createFrameworkRoot();
    createTheme(frameworkRoot, "dark");
    writeFileSync(
      path.join(frameworkRoot, "openworkspace.config.json"),
      JSON.stringify({ workspaceRoot: "./workspace", theme: "dark" }),
      "utf8",
    );

    expect(resolveTheme({ frameworkRoot, env: {} })).toBe("dark");
    expect(resolveThemePath({ frameworkRoot, env: {} })).toBe(
      path.join(frameworkRoot, "themes", "dark", "theme.css"),
    );
  });

  it("拒绝非法或不存在的主题", () => {
    const frameworkRoot = createFrameworkRoot();
    const configPath = path.join(frameworkRoot, "openworkspace.config.json");
    writeFileSync(
      configPath,
      JSON.stringify({ workspaceRoot: "./workspace", theme: "../dark" }),
      "utf8",
    );
    expect(() => resolveTheme({ frameworkRoot, env: {} })).toThrow(
      "theme 只能包含小写字母、数字和连字符",
    );

    writeFileSync(
      configPath,
      JSON.stringify({ workspaceRoot: "./workspace", theme: "missing" }),
      "utf8",
    );
    expect(() => resolveTheme({ frameworkRoot, env: {} })).toThrow(
      "主题不存在或缺少 theme.css",
    );
  });

  it("支持绝对 workspace 路径", () => {
    const frameworkRoot = createFrameworkRoot();
    const absoluteWorkspaceRoot = path.resolve(frameworkRoot, "external");
    mkdirSync(absoluteWorkspaceRoot);
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
