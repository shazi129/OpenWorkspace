import { describe, expect, it, vi } from "vitest";
import {
  createRoutes,
  createRebuildRunner,
  isAuthorized,
} from "../../workspace/services/rebuild/index.mjs";

describe("重新生成服务", () => {
  it("先拉取仓库，再执行生产构建", async () => {
    const calls = [];
    const rebuild = createRebuildRunner({
      repositoryRoot: "C:/workspace",
      platform: "win32",
      runCommand: vi.fn(async (...args) => calls.push(args)),
    });

    await rebuild();

    expect(calls).toEqual([
      ["git", ["pull", "--ff-only"], "C:/workspace"],
      ["npm.cmd", ["run", "build"], "C:/workspace"],
    ]);
  });

  it("拉取失败后不执行构建", async () => {
    const runCommand = vi.fn(async () => {
      throw new Error("pull failed");
    });
    const rebuild = createRebuildRunner({
      repositoryRoot: "/workspace",
      platform: "linux",
      runCommand,
    });

    await expect(rebuild()).rejects.toThrow("pull failed");
    expect(runCommand).toHaveBeenCalledTimes(1);
  });

  it("只接受正确的 Bearer 令牌", () => {
    expect(isAuthorized("Bearer secret", "secret")).toBe(true);
    expect(isAuthorized("Bearer wrong", "secret")).toBe(false);
    expect(isAuthorized(undefined, "secret")).toBe(false);
  });

  it("拒绝未授权请求和并行重新生成", async () => {
    let finishPull;
    const runCommand = vi
      .fn()
      .mockImplementationOnce(
        () => new Promise((resolve) => (finishPull = resolve)),
      )
      .mockResolvedValueOnce(undefined);
    const [route] = createRoutes({
      env: { OPENWORKSPACE_REBUILD_TOKEN: "secret" },
      logger: { error() {}, info() {} },
      platform: "linux",
      repositoryRoot: "/workspace",
      runCommand,
    });

    await expect(
      route.handle({ request: { headers: {} } }),
    ).resolves.toMatchObject({ statusCode: 401 });

    const activeRequest = route.handle({
      request: { headers: { authorization: "Bearer secret" } },
    });
    await vi.waitFor(() => expect(runCommand).toHaveBeenCalledTimes(1));
    await expect(
      route.handle({
        request: { headers: { authorization: "Bearer secret" } },
      }),
    ).resolves.toMatchObject({ statusCode: 409 });

    finishPull();
    await expect(activeRequest).resolves.toMatchObject({
      body: { status: "completed" },
      statusCode: 200,
    });
    expect(runCommand).toHaveBeenCalledTimes(2);
  });
});
