import type { GlobalConfig, ModuleConfig } from "./config-schema";

export type ContentKind = "markdown" | "html";

export interface ContentFile {
  absolutePath: string;
  createTime: string;
  entryId?: string;
  href: string;
  kind: ContentKind;
  label: string;
  rawUrl?: string;
  relativePath: string;
  slug: string;
  tags: string[];
  title: string;
}

export interface ContentIndexEntry {
  create: string;
  href: string;
  kind: ContentKind;
  tags: string[];
  title: string;
}

export interface ContentTreeNode {
  children?: ContentTreeNode[];
  createTime?: string;
  href?: string;
  kind: "directory" | ContentKind;
  label: string;
  slug: string;
}

export interface ModuleManifest extends ModuleConfig {
  absoluteContentDir: string;
  absoluteModuleDir: string;
  contentFiles: ContentFile[];
  contentIndex: ContentIndexEntry[];
  href: string;
  iconUrl: string;
  indexMode: "content" | "generated";
  indexPageSize: number;
  indexSlug: string;
  tree: ContentTreeNode[];
}

export interface SiteManifest extends GlobalConfig {
  modules: ModuleManifest[];
}

export interface ContentRouteProps {
  entryId?: string;
  href: string;
  indexEntries?: ContentIndexEntry[];
  indexPageSize?: number;
  kind: ContentKind | "generated-index";
  label: string;
  moduleId: string;
  rawUrl?: string;
  relativePath: string;
  slug: string;
}

export interface ContentIndexRouteProps {
  entries: ContentIndexEntry[];
}

export interface RawAssetRouteProps {
  absolutePath: string;
  contentType: string;
}
