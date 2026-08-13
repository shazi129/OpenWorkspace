export type OpenWorkspaceConfigSource = "environment" | "config" | "default";

export interface LoadOpenWorkspaceConfigOptions {
  frameworkRoot?: string;
  env?: Record<string, string | undefined>;
}

export interface ResolvedOpenWorkspaceConfig {
  configPath?: string;
  distRoot: string;
  frameworkRoot: string;
  source: OpenWorkspaceConfigSource;
  workspaceRoot: string;
}

export declare const OPENWORKSPACE_CONFIG_FILE: "openworkspace.config.json";

export declare function loadOpenWorkspaceConfig(
  options?: LoadOpenWorkspaceConfigOptions,
): ResolvedOpenWorkspaceConfig;

export declare function resolveWorkspaceRoot(
  options?: LoadOpenWorkspaceConfigOptions,
): string;

export declare function resolveDistRoot(
  options?: LoadOpenWorkspaceConfigOptions,
): string;
