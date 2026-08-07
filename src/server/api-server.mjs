import {
  existsSync,
  readFileSync,
  readdirSync,
  realpathSync,
  statSync,
} from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";

function resolveInside(basePath, relativePath, label) {
  const targetPath = path.resolve(basePath, relativePath);
  const relative = path.relative(basePath, targetPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`${label} 超出了允许目录：${relativePath}`);
  }
  if (!existsSync(targetPath) || !statSync(targetPath).isFile()) {
    throw new Error(`${label} 不存在或不是文件：${targetPath}`);
  }

  const realBasePath = realpathSync(basePath);
  const realTargetPath = realpathSync(targetPath);
  const realRelative = path.relative(realBasePath, realTargetPath);
  if (realRelative.startsWith("..") || path.isAbsolute(realRelative)) {
    throw new Error(`${label} 通过符号链接超出了允许目录：${relativePath}`);
  }
  return realTargetPath;
}

function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`无法解析服务配置：${filePath}`, { cause: error });
  }
}

function workspaceServiceEntries(workspaceRoot) {
  const servicesRoot = path.join(workspaceRoot, "services");
  if (!existsSync(servicesRoot)) return [];

  return readdirSync(servicesRoot, { withFileTypes: true }).flatMap((entry) => {
    if (!entry.isDirectory() || entry.isSymbolicLink()) return [];
    const serviceRoot = path.join(servicesRoot, entry.name);
    const serviceConfigPath = path.join(serviceRoot, "config.json");
    if (!existsSync(serviceConfigPath)) return [];

    const config = readJson(serviceConfigPath);
    if (!config || typeof config !== "object") {
      throw new Error(`服务配置无效：${serviceConfigPath}`);
    }
    if (config.enabled === false) return [];
    if (config.id !== entry.name || typeof config.entry !== "string") {
      throw new Error(`服务配置无效：${serviceConfigPath}`);
    }
    return [resolveInside(serviceRoot, config.entry, `服务 ${config.id} entry`)];
  });
}

function moduleServiceEntries(workspaceRoot) {
  const modulesRoot = path.join(workspaceRoot, "modules");
  if (!existsSync(modulesRoot)) return [];

  return readdirSync(modulesRoot, { withFileTypes: true }).flatMap((entry) => {
    if (!entry.isDirectory() || entry.isSymbolicLink()) return [];
    const moduleRoot = path.join(modulesRoot, entry.name);
    const configPath = path.join(moduleRoot, "config.json");
    if (!existsSync(configPath)) return [];

    const config = readJson(configPath);
    if (!config || typeof config !== "object") {
      throw new Error(`模块配置无效：${configPath}`);
    }
    if (config.runtime !== "server") return [];
    if (
      config.id !== entry.name ||
      typeof config.serverEntry !== "string"
    ) {
      throw new Error(`服务端模块配置无效：${configPath}`);
    }
    return [
      resolveInside(moduleRoot, config.serverEntry, `模块 ${config.id} serverEntry`),
    ];
  });
}

export async function loadWorkspaceRoutes({
  repositoryRoot,
  workspaceRoot,
  env = process.env,
  logger = console,
}) {
  const entries = [
    ...workspaceServiceEntries(workspaceRoot),
    ...moduleServiceEntries(workspaceRoot),
  ];
  const routes = [];

  for (const entry of entries) {
    const serviceModule = await import(pathToFileURL(entry).href);
    if (typeof serviceModule.createRoutes !== "function") {
      throw new Error(`服务入口必须导出 createRoutes()：${entry}`);
    }
    const serviceRoutes = await serviceModule.createRoutes({
      env,
      logger,
      platform: process.platform,
      repositoryRoot,
      workspaceRoot,
    });
    if (!Array.isArray(serviceRoutes)) {
      throw new Error(`服务入口的 createRoutes() 必须返回数组：${entry}`);
    }
    routes.push(...serviceRoutes);
  }

  const routeKeys = new Set();
  for (const route of routes) {
    if (
      typeof route.method !== "string" ||
      typeof route.path !== "string" ||
      !route.path.startsWith("/") ||
      typeof route.handle !== "function"
    ) {
      throw new Error("服务路由必须提供 method、path 和 handle");
    }
    const key = `${route.method.toUpperCase()} ${route.path}`;
    if (routeKeys.has(key)) throw new Error(`服务路由重复：${key}`);
    routeKeys.add(key);
  }

  return routes;
}

function sendJson(response, statusCode, body, allowedOrigin) {
  const json = JSON.stringify(body);
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    ...(allowedOrigin
      ? { "Access-Control-Allow-Origin": allowedOrigin, Vary: "Origin" }
      : {}),
  });
  response.end(json);
}

export function createApiHandler({ routes, allowedOrigin, logger = console }) {
  return async (request, response) => {
    const requestUrl = new URL(
      request.url ?? "/",
      `http://${request.headers.host ?? "localhost"}`,
    );

    if (request.method === "GET" && requestUrl.pathname === "/health") {
      sendJson(response, 200, { status: "ok" }, allowedOrigin);
      return;
    }

    const route = routes.find(
      (candidate) =>
        candidate.path === requestUrl.pathname &&
        candidate.method.toUpperCase() === request.method,
    );

    if (request.method === "OPTIONS") {
      const hasRoute = routes.some(
        (candidate) => candidate.path === requestUrl.pathname,
      );
      if (hasRoute) {
        response.writeHead(204, {
          ...(allowedOrigin
            ? {
                "Access-Control-Allow-Headers": "Authorization, Content-Type",
                "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
                "Access-Control-Allow-Origin": allowedOrigin,
                Vary: "Origin",
              }
            : {}),
        });
        response.end();
        return;
      }
    }

    if (!route) {
      sendJson(response, 404, { error: "Not found" }, allowedOrigin);
      return;
    }

    try {
      const result = await route.handle({ request, requestUrl });
      sendJson(
        response,
        result?.statusCode ?? 200,
        result?.body ?? { status: "ok" },
        allowedOrigin,
      );
    } catch (error) {
      logger.error(error);
      sendJson(
        response,
        500,
        { error: "服务执行失败，请查看后台日志" },
        allowedOrigin,
      );
    }
  };
}

export function startApiServer({
  routes,
  host = "127.0.0.1",
  port = 4174,
  allowedOrigin,
  logger = console,
}) {
  const server = createServer(
    createApiHandler({ routes, allowedOrigin, logger }),
  );
  server.listen(port, host, () => {
    logger.info(`OpenWorkspace API 服务监听 http://${host}:${port}`);
  });
  return server;
}
