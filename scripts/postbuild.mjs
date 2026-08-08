import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const dist = resolve(root, "dist");

// Read defaultModule from workspace/config.json
const configPath = resolve(root, "workspace", "config.json");
const config = JSON.parse(readFileSync(configPath, "utf-8"));
const defaultModule = config.defaultModule;

if (!defaultModule) {
  console.log("[postbuild] No defaultModule in workspace/config.json, skipping.");
  process.exit(0);
}

const srcIndex = resolve(dist, defaultModule, "index.html");
const dstIndex = resolve(dist, "index.html");

if (!existsSync(srcIndex)) {
  console.log(`[postbuild] Default module index not found: ${srcIndex}, skipping.`);
  process.exit(0);
}

copyFileSync(srcIndex, dstIndex);
console.log(`[postbuild] Copied ${defaultModule}/index.html -> index.html`);
