import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadOpenWorkspaceConfig } from "../src/core/openworkspace-config.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const { distRoot, workspaceRoot } = loadOpenWorkspaceConfig({
  frameworkRoot: root,
});

// Read defaultModule from the selected workspace.
const configPath = resolve(workspaceRoot, "config.json");
const config = JSON.parse(readFileSync(configPath, "utf-8"));
const defaultModule = config.defaultModule;

if (!defaultModule) {
  console.log(`[postbuild] No defaultModule in ${configPath}, skipping.`);
  process.exit(0);
}

const srcIndex = resolve(distRoot, defaultModule, "index.html");
const dstIndex = resolve(distRoot, "index.html");

if (!existsSync(srcIndex)) {
  console.log(`[postbuild] Default module index not found: ${srcIndex}, skipping.`);
  process.exit(0);
}

copyFileSync(srcIndex, dstIndex);
console.log(`[postbuild] Copied ${defaultModule}/index.html -> index.html`);
