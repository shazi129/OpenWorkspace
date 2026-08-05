import type { GlobalConfig, ModuleConfig } from "./config-schema";

export type ContentKind = "markdown" | "html";

export interface ContentFile {
  absolutePath: string;
  entryId?: string;
  href: string;
  kind: ContentKind;
  label: string;
  rawUrl?: string;
  relativePath: string;
  slug: string;
}

export interface ContentTreeNode {
  children?: ContentTreeNode[];
  href?: string;
  kind: "directory" | ContentKind;
  label: string;
  slug: string;
}

export interface ModuleManifest extends ModuleConfig {
  absoluteContentDir: string;
  absoluteModuleDir: string;
  contentFiles: ContentFile[];
  href: string;
  iconUrl: string;
  indexSlug: string;
  tree: ContentTreeNode[];
}

export interface SiteManifest extends GlobalConfig {
  modules: ModuleManifest[];
}

export interface ContentRouteProps {
  entryId?: string;
  href: string;
  kind: ContentKind;
  label: string;
  moduleId: string;
  rawUrl?: string;
  relativePath: string;
  slug: string;
}

export interface RawAssetRouteProps {
  absolutePath: string;
  contentType: string;
}

