import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createContextReport } from "../../scripts/context-report.mjs";

const repositoryRoot = path.resolve(import.meta.dirname, "../..");

function read(relativePath: string): string {
  return readFileSync(path.join(repositoryRoot, relativePath), "utf8");
}

function listMarkdownFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listMarkdownFiles(entryPath);
    return entry.isFile() && entry.name.endsWith(".md") ? [entryPath] : [];
  });
}

describe("Agent 工程上下文", () => {
  it("为 Codex 和 CodeBuddy 提供公共知识入口", () => {
    const codexInstructions = read("AGENTS.md");
    const codeBuddyMemory = read("CODEBUDDY.md");
    const packageJson = JSON.parse(read("package.json"));

    expect(packageJson.scripts.context).toBe("node scripts/context-report.mjs");

    for (const sharedDocument of [
      "docs/agent/CONTEXT.md",
      "docs/agent/WORKFLOW.md",
      "docs/agent/INDEX.md",
    ]) {
      expect(existsSync(path.join(repositoryRoot, sharedDocument))).toBe(true);
      expect(codexInstructions).toContain(sharedDocument);
      expect(codeBuddyMemory).toContain(`@${sharedDocument}`);
    }
  });

  it("动态报告包含公共上下文和 Git 状态", () => {
    const report = createContextReport({
      startDirectory: repositoryRoot,
      commitLimit: 3,
    });

    expect(report).toContain("# OpenWorkspace 工程快速上下文");
    expect(report).toContain("# Repository State（动态生成）");
    expect(report).toContain("## 当前分支");
    expect(report).toContain("## 最近提交");
  });

  it("公共工程文档中的相对链接均指向现有文件", () => {
    const markdownFiles = [
      path.join(repositoryRoot, "README.md"),
      path.join(repositoryRoot, "AGENTS.md"),
      path.join(repositoryRoot, "CODEBUDDY.md"),
      path.join(repositoryRoot, "CHANGELOG.md"),
      ...listMarkdownFiles(path.join(repositoryRoot, "docs")),
    ];

    for (const markdownFile of markdownFiles) {
      const content = readFileSync(markdownFile, "utf8");
      const relativeLinks = content.matchAll(
        /\]\((?![a-z][a-z0-9+.-]*:|\/|#)([^)#]+)(?:#[^)]+)?\)/gi,
      );

      for (const match of relativeLinks) {
        const target = path.resolve(path.dirname(markdownFile), match[1]);
        expect(existsSync(target), `${markdownFile} -> ${match[1]}`).toBe(true);
      }
    }
  });
});
