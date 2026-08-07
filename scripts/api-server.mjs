import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadWorkspaceRoutes,
  startApiServer,
} from "../src/server/api-server.mjs";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const workspaceRoot = path.resolve(
  process.env.OPENWORKSPACE_WORKSPACE_ROOT ??
    path.join(repositoryRoot, "workspace"),
);
const port = Number.parseInt(
  process.env.OPENWORKSPACE_API_PORT ?? "4174",
  10,
);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("OPENWORKSPACE_API_PORT 必须是有效端口");
}

const routes = await loadWorkspaceRoutes({ repositoryRoot, workspaceRoot });
startApiServer({
  routes,
  host: process.env.OPENWORKSPACE_API_HOST ?? "127.0.0.1",
  port,
  allowedOrigin: process.env.OPENWORKSPACE_API_ALLOWED_ORIGIN,
});
