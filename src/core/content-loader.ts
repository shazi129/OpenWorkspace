import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import path from "node:path";
import {
  parseGlobalConfig,
  parseModuleConfig,
  type ModuleConfig,
} from "./config-schema";
import type {
  ContentFile,
  ContentRouteProps,
  ContentTreeNode,
  ModuleManifest,
  RawAssetRouteProps,
  SiteManifest,
} from "./types";

// Astro 会把构建代码打包到 dist/.prerender，不能用 import.meta.url
// 反推项目根目录。所有 CLI 命令均从项目根目录运行，因此以 cwd 为准。
export const WORKSPACE_ROOT = path.resolve(
  process.env.OPENWORKSPACE_WORKSPACE_ROOT ??
    path.join(process.cwd(), "workspace"),
);

const contentExtensions = new Set([".md", ".html", ".htm"]);
const collator = new Intl.Collator("zh-CN", {
  numeric: true,
  sensitivity: "base",
});

function compareModuleOrder(
  left: ModuleManifest,
  right: ModuleManifest,
): number {
  const leftIsBottom = left.order < 0;
  const rightIsBottom = right.order < 0;

  if (leftIsBottom !== rightIsBottom) return leftIsBottom ? 1 : -1;

  return left.order - right.order || collator.compare(left.title, right.title);
}

function readJson(filePath: string): unknown {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`无法解析配置文件 ${filePath}`, { cause: error });
  }
}

function normalizeRelativePath(value: string): string {
  return value.replace(/^\.([\\/])/, "").replaceAll("\\", "/");
}

function resolveInside(basePath: string, relativePath: string, label: string): string {
  const targetPath = path.resolve(basePath, normalizeRelativePath(relativePath));
  const relative = path.relative(basePath, targetPath);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`${label} 超出了允许目录：${relativePath}`);
  }

  return targetPath;
}

function toPosix(relativePath: string): string {
  return relativePath.replaceAll(path.sep, "/");
}

function stripContentExtension(relativePath: string): string {
  return relativePath.replace(/\.(?:md|html?)$/i, "");
}

function routeSlug(relativePath: string): string {
  const withoutExtension = stripContentExtension(toPosix(relativePath));

  if (withoutExtension === "index") {
    return "";
  }

  return withoutExtension.replace(/\/index$/i, "");
}

function encodeUrlPath(value: string): string {
  return value
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export function contentHref(moduleId: string, slug: string): string {
  const encodedModule = encodeURIComponent(moduleId);
  const encodedSlug = encodeUrlPath(slug);
  return encodedSlug ? `/${encodedModule}/${encodedSlug}/` : `/${encodedModule}/`;
}

function rawAssetUrl(moduleId: string, moduleRelativePath: string): string {
  return `/openworkspace-assets/${encodeURIComponent(moduleId)}/${encodeUrlPath(moduleRelativePath)}`;
}

function contentKind(filePath: string): ContentFile["kind"] | undefined {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".md") return "markdown";
  if (extension === ".html" || extension === ".htm") return "html";
  return undefined;
}

function listFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => collator.compare(left.name, right.name))
    .flatMap((entry): string[] => {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) return [];
      if (entry.isDirectory()) return listFiles(absolutePath);
      return entry.isFile() ? [absolutePath] : [];
    });
}

function buildContentFiles(
  moduleId: string,
  moduleDir: string,
  contentDir: string,
  modulesRoot: string,
): ContentFile[] {
  return listFiles(contentDir).flatMap((absolutePath) => {
    const kind = contentKind(absolutePath);
    if (!kind) return [];

    const relativePath = toPosix(path.relative(contentDir, absolutePath));
    const slug = routeSlug(relativePath);
    const label = path.basename(relativePath, path.extname(relativePath));
    const moduleRelativePath = toPosix(path.relative(moduleDir, absolutePath));

    return [
      {
        absolutePath,
        entryId:
          kind === "markdown"
            ? stripContentExtension(
                toPosix(path.relative(modulesRoot, absolutePath)),
              )
            : undefined,
        href: contentHref(moduleId, slug),
        kind,
        label,
        rawUrl:
          kind === "html" ? rawAssetUrl(moduleId, moduleRelativePath) : undefined,
        relativePath,
        slug,
      },
    ];
  });
}

function buildModuleIndexFile(
  moduleId: string,
  moduleDir: string,
  indexPath: string,
  modulesRoot: string,
): ContentFile {
  const kind = contentKind(indexPath);
  if (!kind) {
    throw new Error(`模块 ${moduleId} 的 index 必须是 Markdown 或 HTML 文件`);
  }

  const relativePath = toPosix(path.relative(moduleDir, indexPath));
  return {
    absolutePath: indexPath,
    entryId:
      kind === "markdown"
        ? stripContentExtension(toPosix(path.relative(modulesRoot, indexPath)))
        : undefined,
    href: contentHref(moduleId, ""),
    kind,
    label: path.basename(indexPath, path.extname(indexPath)),
    rawUrl: kind === "html" ? rawAssetUrl(moduleId, relativePath) : undefined,
    relativePath,
    slug: "",
  };
}

function buildTree(
  directory: string,
  moduleId: string,
  contentRoot: string,
): ContentTreeNode[] {
  return readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => {
      if (left.isDirectory() !== right.isDirectory()) {
        return left.isDirectory() ? -1 : 1;
      }
      return collator.compare(left.name, right.name);
    })
    .flatMap((entry): ContentTreeNode[] => {
      if (entry.isSymbolicLink()) return [];

      const absolutePath = path.join(directory, entry.name);
      const relativePath = toPosix(path.relative(contentRoot, absolutePath));

      if (entry.isDirectory()) {
        const children = buildTree(absolutePath, moduleId, contentRoot);
        if (children.length === 1 && children[0].kind !== "directory") {
          return children;
        }

        return children.length
          ? [
              {
                children,
                kind: "directory" as const,
                label: entry.name,
                slug: toPosix(relativePath),
              },
            ]
          : [];
      }

      const kind = contentKind(absolutePath);
      if (!kind) return [];

      const slug = routeSlug(relativePath);
      return [
        {
          href: contentHref(moduleId, slug),
          kind,
          label: path.basename(entry.name, path.extname(entry.name)),
          slug,
        },
      ];
    });
}

export function buildContentTree(
  contentRoot: string,
  moduleId: string,
): ContentTreeNode[] {
  return buildTree(contentRoot, moduleId, contentRoot);
}

function validateModulePaths(
  moduleDir: string,
  config: ModuleConfig,
): { contentDir: string; iconPath: string; indexPath: string } {
  const contentDir = resolveInside(moduleDir, config.contentDir, "contentDir");
  const iconPath = resolveInside(moduleDir, config.icon, "icon");
  const indexPath = resolveInside(moduleDir, config.index, "index");

  for (const [label, target] of [
    ["contentDir", contentDir],
    ["icon", iconPath],
    ["index", indexPath],
  ] as const) {
    if (!existsSync(target)) {
      throw new Error(`模块 ${config.id} 的 ${label} 不存在：${target}`);
    }
  }

  if (!statSync(contentDir).isDirectory()) {
    throw new Error(`模块 ${config.id} 的 contentDir 必须是目录`);
  }

  const legacyContentIndex = listFiles(contentDir).find(
    (filePath) =>
      toPosix(path.relative(contentDir, filePath)).toLowerCase() === "index.md",
  );
  if (legacyContentIndex) {
    throw new Error(
      `模块 ${config.id} 的 contentDir 根目录不能包含 index.md，请将它移动到模块目录`,
    );
  }

  if (!contentExtensions.has(path.extname(indexPath).toLowerCase())) {
    throw new Error(`模块 ${config.id} 的 index 必须是 Markdown 或 HTML 文件`);
  }

  if (config.runtime === "server" && config.serverEntry) {
    const serverEntryPath = resolveInside(
      moduleDir,
      config.serverEntry,
      "serverEntry",
    );
    if (!existsSync(serverEntryPath) || !statSync(serverEntryPath).isFile()) {
      throw new Error(
        `模块 ${config.id} 的 serverEntry 不存在或不是文件：${serverEntryPath}`,
      );
    }
  }

  return { contentDir, iconPath, indexPath };
}

function loadModule(
  moduleDir: string,
  directoryName: string,
  modulesRoot: string,
): ModuleManifest | undefined {
  const configPath = path.join(moduleDir, "config.json");
  if (!existsSync(configPath)) return undefined;

  const config = parseModuleConfig(readJson(configPath));
  if (config.id !== directoryName) {
    throw new Error(`模块目录名 ${directoryName} 必须与 config.json 中的 id ${config.id} 一致`);
  }

  // 未发布及需要认证的模块不能进入静态产物。private 只隐藏导航，
  // 仍属于可通过 URL 访问的公开静态内容。
  if (!config.publish || config.access !== "public") return undefined;

  const { contentDir, iconPath, indexPath } = validateModulePaths(moduleDir, config);
  const scannedContentFiles = buildContentFiles(
    config.id,
    moduleDir,
    contentDir,
    modulesRoot,
  );
  const contentIndexFile = scannedContentFiles.find(
    (file) => path.resolve(file.absolutePath) === path.resolve(indexPath),
  );
  const indexFile =
    contentIndexFile ??
    buildModuleIndexFile(config.id, moduleDir, indexPath, modulesRoot);
  const contentFiles = contentIndexFile
    ? scannedContentFiles
    : [indexFile, ...scannedContentFiles];

  const duplicateSlug = contentFiles.find(
    (file, index) =>
      contentFiles.findIndex((candidate) => candidate.slug === file.slug) !== index,
  );
  if (duplicateSlug) {
    throw new Error(`模块 ${config.id} 存在重复内容 URL：${duplicateSlug.href}`);
  }

  const iconRelativePath = toPosix(path.relative(moduleDir, iconPath));

  return {
    ...config,
    absoluteContentDir: contentDir,
    absoluteModuleDir: moduleDir,
    contentFiles,
    href: indexFile.href,
    iconUrl: rawAssetUrl(config.id, iconRelativePath),
    indexSlug: indexFile.slug,
    tree: buildContentTree(contentDir, config.id),
  };
}

export function loadSiteManifest(workspaceRoot = WORKSPACE_ROOT): SiteManifest {
  const globalConfigPath = path.join(workspaceRoot, "config.json");
  const globalConfig = parseGlobalConfig(readJson(globalConfigPath));
  const modulesRoot = path.join(workspaceRoot, "modules");

  if (!existsSync(modulesRoot) || !statSync(modulesRoot).isDirectory()) {
    throw new Error(`workspace/modules 不存在：${modulesRoot}`);
  }

  const modules = readdirSync(modulesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.isSymbolicLink())
    .map((entry) =>
      loadModule(path.join(modulesRoot, entry.name), entry.name, modulesRoot),
    )
    .filter((module): module is ModuleManifest => Boolean(module))
    .sort(compareModuleOrder);

  if (modules.length === 0) {
    throw new Error("workspace/modules 中没有可静态发布的模块");
  }

  if (!modules.some((module) => module.id === globalConfig.defaultModule)) {
    throw new Error(
      `defaultModule ${globalConfig.defaultModule} 不存在，或未进入静态发布`,
    );
  }

  return { ...globalConfig, modules };
}

export function getContentRoutePaths(workspaceRoot = WORKSPACE_ROOT) {
  return loadSiteManifest(workspaceRoot).modules.flatMap((module) =>
    module.contentFiles.map((file) => ({
      params: {
        module: module.id,
        slug: file.slug || undefined,
      },
      props: {
        entryId: file.entryId,
        href: file.href,
        kind: file.kind,
        label: file.label,
        moduleId: module.id,
        rawUrl: file.rawUrl,
        relativePath: file.relativePath,
        slug: file.slug,
      } satisfies ContentRouteProps,
    })),
  );
}

function contentType(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();
  const types: Record<string, string> = {
    ".css": "text/css; charset=utf-8",
    ".gif": "image/gif",
    ".htm": "text/html; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".ico": "image/x-icon",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml; charset=utf-8",
    ".webp": "image/webp",
  };
  return types[extension] ?? "application/octet-stream";
}

export function getRawAssetRoutePaths(workspaceRoot = WORKSPACE_ROOT) {
  return loadSiteManifest(workspaceRoot).modules.flatMap((module) => {
    const iconPath = resolveInside(module.absoluteModuleDir, module.icon, "icon");
    const assetPaths = [
      iconPath,
      ...module.contentFiles
        .filter((file) => file.kind === "html")
        .map((file) => file.absolutePath),
      ...listFiles(module.absoluteContentDir).filter(
        (filePath) => path.extname(filePath).toLowerCase() !== ".md",
      ),
    ];

    return [...new Set(assetPaths)].map((absolutePath) => {
      const relativePath = toPosix(
        path.relative(module.absoluteModuleDir, absolutePath),
      );
      return {
        params: {
          module: module.id,
          path: relativePath,
        },
        props: {
          absolutePath,
          contentType: contentType(absolutePath),
        } satisfies RawAssetRouteProps,
      };
    });
  });
}
