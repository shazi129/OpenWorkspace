import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  DEFAULT_CONTENT_TAG,
  normalizeContentTags,
  readContentMetadata,
} from "../../src/core/content-metadata";

const temporaryDirectories: string[] = [];

function createMarkdown(contents: string): string {
  const root = mkdtempSync(path.join(tmpdir(), "openworkspace-metadata-"));
  temporaryDirectories.push(root);
  const filePath = path.join(root, "文章.md");
  writeFileSync(filePath, contents, "utf8");
  return filePath;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe("内容元数据", () => {
  it("读取 create 并拆分逗号分隔的 tags", () => {
    const filePath = createMarkdown(
      "---\ncreate: 2009-04-20 00:00:00\ntags: 读书笔记,文学\n---\n\n# 文章",
    );

    expect(readContentMetadata(filePath)).toEqual({
      createTime: "2009-04-20T00:00:00.000Z",
      tags: ["读书笔记", "文学"],
    });
  });

  it("兼容 tags 数组、中文逗号并移除重复项", () => {
    expect(normalizeContentTags(["技术，笔记", "技术"])).toEqual([
      "技术",
      "笔记",
    ]);
  });

  it("没有 tags 时使用默认标记", () => {
    const filePath = createMarkdown("# 没有 Frontmatter 的文章");

    expect(readContentMetadata(filePath)).toEqual({
      tags: [DEFAULT_CONTENT_TAG],
    });
  });

  it("拒绝无效的 create", () => {
    const filePath = createMarkdown(
      "---\ncreate: not-a-date\n---\n\n# 文章",
    );

    expect(() => readContentMetadata(filePath)).toThrow("元数据无效");
  });
});
