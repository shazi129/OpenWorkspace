import { readFileSync } from "node:fs";
import { load } from "js-yaml";

export const DEFAULT_CONTENT_TAG = "默认";

export interface ContentMetadata {
  createTime?: string;
  tags: string[];
}

const frontmatterPattern =
  /^(?:\uFEFF)?---[\t ]*\r?\n([\s\S]*?)\r?\n(?:---|\.\.\.)[\t ]*(?:\r?\n|$)/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeContentTags(value: unknown): string[] {
  if (value === undefined || value === null || value === "") {
    return [DEFAULT_CONTENT_TAG];
  }

  const values = Array.isArray(value) ? value : [value];
  if (!values.every((tag) => typeof tag === "string")) {
    throw new Error("tags 必须是逗号分隔的字符串或字符串数组");
  }

  const tags = values
    .flatMap((tag) => tag.split(/[,，]/u))
    .map((tag) => tag.trim())
    .filter(Boolean);

  return tags.length > 0 ? [...new Set(tags)] : [DEFAULT_CONTENT_TAG];
}

export function normalizeCreateTime(
  value: unknown,
  sourceLabel = "Markdown",
): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;

  if (!(value instanceof Date) && typeof value !== "string") {
    throw new Error(`${sourceLabel} 的 create 必须是日期时间`);
  }

  const timestamp = value instanceof Date ? value.getTime() : Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    throw new Error(`${sourceLabel} 的 create 不是有效日期时间：${value}`);
  }

  return new Date(timestamp).toISOString();
}

export function readContentMetadata(filePath: string): ContentMetadata {
  const source = readFileSync(filePath, "utf8");
  const frontmatter = source.match(frontmatterPattern)?.[1];
  if (frontmatter === undefined) {
    return { tags: [DEFAULT_CONTENT_TAG] };
  }

  let parsed: unknown;
  try {
    parsed = load(frontmatter);
  } catch (error) {
    throw new Error(`无法解析 Markdown Frontmatter：${filePath}`, {
      cause: error,
    });
  }

  const data = isRecord(parsed) ? parsed : {};
  try {
    return {
      createTime: normalizeCreateTime(data.create, filePath),
      tags: normalizeContentTags(data.tags),
    };
  } catch (error) {
    throw new Error(`Markdown 元数据无效：${filePath}`, { cause: error });
  }
}
