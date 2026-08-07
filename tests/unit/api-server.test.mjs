import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  loadWorkspaceRoutes,
  startApiServer,
} from "../../src/server/api-server.mjs";

const servers = [];
const temporaryDirectories = [];

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise((resolve, reject) =>
          server.close((error) => (error ? reject(error) : resolve())),
        ),
    ),
  );
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe("API 服务宿主", () => {
  it("发现 workspace 中启用的服务", async () => {
    const repositoryRoot = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../..",
    );
    const routes = await loadWorkspaceRoutes({
      repositoryRoot,
      workspaceRoot: path.join(repositoryRoot, "workspace"),
      env: { OPENWORKSPACE_REBUILD_TOKEN: "test-token" },
      logger: { error() {}, info() {} },
    });

    expect(routes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          method: "POST",
          path: "/openworkspace-admin/rebuild",
        }),
      ]),
    );
  });

  it("提供健康检查并分发注册路由", async () => {
    const server = startApiServer({
      host: "127.0.0.1",
      port: 0,
      routes: [
        {
          method: "GET",
          path: "/api/example",
          async handle() {
            return { statusCode: 200, body: { value: 42 } };
          },
        },
      ],
      logger: { error() {}, info() {} },
    });
    servers.push(server);
    await new Promise((resolve) => server.once("listening", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("无效监听地址");

    const health = await fetch(`http://127.0.0.1:${address.port}/health`);
    const example = await fetch(
      `http://127.0.0.1:${address.port}/api/example`,
    );

    await expect(health.json()).resolves.toEqual({ status: "ok" });
    await expect(example.json()).resolves.toEqual({ value: 42 });
  });

  it("发现 runtime 为 server 的模块入口", async () => {
    const repositoryRoot = mkdtempSync(
      path.join(os.tmpdir(), "openworkspace-api-test-"),
    );
    temporaryDirectories.push(repositoryRoot);
    const workspaceRoot = path.join(repositoryRoot, "workspace");
    const moduleRoot = path.join(workspaceRoot, "modules", "stocks");
    mkdirSync(path.join(moduleRoot, "server"), { recursive: true });
    writeFileSync(
      path.join(moduleRoot, "config.json"),
      JSON.stringify({
        id: "stocks",
        runtime: "server",
        serverEntry: "./server/index.mjs",
      }),
    );
    writeFileSync(
      path.join(moduleRoot, "server", "index.mjs"),
      'export function createRoutes() { return [{ method: "GET", path: "/api/stocks", handle() { return { body: { ok: true } }; } }]; }',
    );

    const routes = await loadWorkspaceRoutes({
      repositoryRoot,
      workspaceRoot,
    });

    expect(routes).toEqual([
      expect.objectContaining({ method: "GET", path: "/api/stocks" }),
    ]);
  });
});
