import { spawn } from "node:child_process";
import { timingSafeEqual } from "node:crypto";

const REBUILD_PATH = "/openworkspace-admin/rebuild";
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;

function safeTokenEqual(actual, expected) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

export function isAuthorized(authorizationHeader, token) {
  return (
    typeof authorizationHeader === "string" &&
    safeTokenEqual(authorizationHeader, `Bearer ${token}`)
  );
}

export function createCommandRunner({
  timeoutMs = DEFAULT_TIMEOUT_MS,
  writeOutput = (chunk) => process.stdout.write(chunk),
} = {}) {
  return (command, args, repositoryRoot) =>
    new Promise((resolve, reject) => {
      let settled = false;
      const finish = (callback) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        callback();
      };
      const child = spawn(command, args, {
        cwd: repositoryRoot,
        env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
        shell: false,
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
      });
      let errorOutput = "";
      const timeout = setTimeout(() => {
        child.kill();
        finish(() => reject(new Error(`${command} 执行超时`)));
      }, timeoutMs);

      child.stdout.on("data", (chunk) => writeOutput(chunk));
      child.stderr.on("data", (chunk) => {
        errorOutput = `${errorOutput}${chunk}`.slice(-8000);
        writeOutput(chunk);
      });
      child.on("error", (error) => finish(() => reject(error)));
      child.on("close", (code) =>
        finish(() => {
          if (code === 0) resolve();
          else {
            reject(
              new Error(
                `${command} ${args.join(" ")} 执行失败（退出码 ${code}）${
                  errorOutput.trim() ? `\n${errorOutput.trim()}` : ""
                }`,
              ),
            );
          }
        }),
      );
    });
}

export function createRebuildRunner({
  repositoryRoot,
  runCommand = createCommandRunner(),
  platform = process.platform,
}) {
  const npmCommand = platform === "win32" ? "npm.cmd" : "npm";
  return async () => {
    await runCommand("git", ["pull", "--ff-only"], repositoryRoot);
    await runCommand(npmCommand, ["run", "build"], repositoryRoot);
  };
}

export function createRoutes({
  env,
  logger,
  platform,
  repositoryRoot,
  runCommand,
}) {
  const token = env.OPENWORKSPACE_REBUILD_TOKEN;
  if (!token) throw new Error("必须设置 OPENWORKSPACE_REBUILD_TOKEN");

  const timeoutMs = Number.parseInt(
    env.OPENWORKSPACE_REBUILD_TIMEOUT_MS ?? String(DEFAULT_TIMEOUT_MS),
    10,
  );
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1000) {
    throw new Error("OPENWORKSPACE_REBUILD_TIMEOUT_MS 必须不少于 1000");
  }

  const rebuild = createRebuildRunner({
    repositoryRoot,
    platform,
    runCommand: runCommand ?? createCommandRunner({ timeoutMs }),
  });
  let activeRebuild;

  return [
    {
      method: "POST",
      path: REBUILD_PATH,
      async handle({ request }) {
        if (!isAuthorized(request.headers.authorization, token)) {
          return { statusCode: 401, body: { error: "令牌无效" } };
        }
        if (activeRebuild) {
          return {
            statusCode: 409,
            body: { error: "重新生成任务正在执行" },
          };
        }

        const startedAt = Date.now();
        activeRebuild = rebuild();
        logger.info("OpenWorkspace 重新生成开始");
        try {
          await activeRebuild;
          logger.info("OpenWorkspace 重新生成完成");
          return {
            statusCode: 200,
            body: {
              durationMs: Date.now() - startedAt,
              status: "completed",
            },
          };
        } catch (error) {
          logger.error(error);
          return {
            statusCode: 500,
            body: { error: "拉取或构建失败，请查看后台日志" },
          };
        } finally {
          activeRebuild = undefined;
        }
      },
    },
  ];
}
