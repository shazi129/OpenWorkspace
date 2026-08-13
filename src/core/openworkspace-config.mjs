import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export const OPENWORKSPACE_CONFIG_FILE = "openworkspace.config.json";
const DEFAULT_DIST_ROOT = "./dist";

function isSameOrInside(basePath, targetPath) {
  const relative = path.relative(basePath, targetPath);
  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
}

function validateDistRoot({ distRoot, frameworkRoot, workspaceRoot }) {
  if (
    isSameOrInside(distRoot, frameworkRoot) ||
    isSameOrInside(distRoot, workspaceRoot)
  ) {
    throw new Error("OpenWorkspace 配置 distRoot 不能是框架或工作区的根目录/父目录");
  }

  const protectedPaths = [
    path.join(frameworkRoot, ".git"),
    path.join(frameworkRoot, "docs"),
    path.join(frameworkRoot, "node_modules"),
    path.join(frameworkRoot, "public"),
    path.join(frameworkRoot, "scripts"),
    path.join(frameworkRoot, "src"),
    path.join(frameworkRoot, "tests"),
    path.join(workspaceRoot, "deploy"),
    path.join(workspaceRoot, "modules"),
    path.join(workspaceRoot, "services"),
    path.join(workspaceRoot, "storage"),
  ];

  if (
    protectedPaths.some((protectedPath) =>
      isSameOrInside(protectedPath, distRoot),
    )
  ) {
    throw new Error(
      `OpenWorkspace 配置 distRoot 不能位于源码或私有数据目录内：${distRoot}`,
    );
  }
}

function parseConfig(configPath) {
  let value;
  try {
    value = JSON.parse(readFileSync(configPath, "utf8"));
  } catch (error) {
    throw new Error(`无法解析 OpenWorkspace 配置文件：${configPath}`, {
      cause: error,
    });
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`OpenWorkspace 配置必须是 JSON 对象：${configPath}`);
  }

  const knownKeys = new Set(["distRoot", "workspaceRoot"]);
  const unknownKeys = Object.keys(value).filter((key) => !knownKeys.has(key));
  if (unknownKeys.length > 0) {
    throw new Error(
      `OpenWorkspace 配置包含未知字段：${unknownKeys.join(", ")}`,
    );
  }

  if (
    typeof value.workspaceRoot !== "string" ||
    value.workspaceRoot.trim().length === 0
  ) {
    throw new Error(
      `OpenWorkspace 配置 workspaceRoot 必须是非空字符串：${configPath}`,
    );
  }

  if (
    value.distRoot !== undefined &&
    (typeof value.distRoot !== "string" || value.distRoot.trim().length === 0)
  ) {
    throw new Error(
      `OpenWorkspace 配置 distRoot 必须是非空字符串：${configPath}`,
    );
  }

  return {
    distRoot: value.distRoot?.trim() ?? DEFAULT_DIST_ROOT,
    workspaceRoot: value.workspaceRoot.trim(),
  };
}

export function loadOpenWorkspaceConfig({
  frameworkRoot = process.cwd(),
  env = process.env,
} = {}) {
  const resolvedFrameworkRoot = path.resolve(frameworkRoot);
  const environmentWorkspaceRoot = env.OPENWORKSPACE_WORKSPACE_ROOT;
  const configPath = path.join(resolvedFrameworkRoot, OPENWORKSPACE_CONFIG_FILE);
  const config = existsSync(configPath) ? parseConfig(configPath) : undefined;

  if (
    environmentWorkspaceRoot !== undefined &&
    (typeof environmentWorkspaceRoot !== "string" ||
      environmentWorkspaceRoot.trim().length === 0)
  ) {
    throw new Error("OPENWORKSPACE_WORKSPACE_ROOT 必须是非空路径");
  }

  const workspaceRoot = path.resolve(
    resolvedFrameworkRoot,
    environmentWorkspaceRoot?.trim() ?? config?.workspaceRoot ?? "./workspace",
  );
  const distRoot = path.resolve(
    resolvedFrameworkRoot,
    config?.distRoot ?? DEFAULT_DIST_ROOT,
  );
  validateDistRoot({
    distRoot,
    frameworkRoot: resolvedFrameworkRoot,
    workspaceRoot,
  });

  return {
    ...(config ? { configPath } : {}),
    distRoot,
    frameworkRoot: resolvedFrameworkRoot,
    source: environmentWorkspaceRoot
      ? "environment"
      : config
        ? "config"
        : "default",
    workspaceRoot,
  };
}

export function resolveWorkspaceRoot(options) {
  return loadOpenWorkspaceConfig(options).workspaceRoot;
}

export function resolveDistRoot(options) {
  return loadOpenWorkspaceConfig(options).distRoot;
}
