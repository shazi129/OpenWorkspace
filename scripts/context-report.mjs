import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

function runGit(repositoryRoot, args, fallback) {
  try {
    return execFileSync("git", args, {
      cwd: repositoryRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return fallback;
  }
}

function findRepositoryRoot(startDirectory) {
  return runGit(
    startDirectory,
    ["rev-parse", "--show-toplevel"],
    path.resolve(startDirectory),
  );
}

export function createContextReport({
  startDirectory = process.cwd(),
  commitLimit = 12,
} = {}) {
  const repositoryRoot = findRepositoryRoot(startDirectory);
  const contextPath = path.join(
    repositoryRoot,
    "docs",
    "agent",
    "CONTEXT.md",
  );
  const context = readFileSync(contextPath, "utf8").trim();
  const branch = runGit(
    repositoryRoot,
    ["branch", "--show-current"],
    "（无法读取）",
  );
  const status = runGit(
    repositoryRoot,
    ["status", "--short"],
    "（无法读取）",
  );
  const recentCommits = runGit(
    repositoryRoot,
    [
      "log",
      `-${Math.max(1, commitLimit)}`,
      "--date=short",
      "--pretty=format:%h%x09%ad%x09%s",
    ],
    "（无法读取）",
  );

  return `${context}\n\n---\n\n# Repository State（动态生成）\n\n## 当前分支\n\n${branch || "（detached HEAD）"}\n\n## 未提交修改\n\n\`\`\`text\n${status || "（clean）"}\n\`\`\`\n\n## 最近提交\n\n\`\`\`text\n${recentCommits || "（没有提交）"}\n\`\`\`\n`;
}

const invokedPath = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : undefined;

if (invokedPath === import.meta.url) {
  process.stdout.write(createContextReport());
}
