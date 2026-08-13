# 私有服务运行时

## 职责

服务运行时让公开框架承载当前所选工作区中的私有 API，同时保持网页构建产物仍为纯静态 `<distRoot>/`。

## 目录边界

| 路径 | 职责 |
| --- | --- |
| `src/server/api-server.mjs` | 通用 HTTP、路由发现、健康检查和错误边界 |
| `scripts/api-server.mjs` | 读取环境变量并启动宿主 |
| `<workspaceRoot>/services/<service>/` | 不属于单个页面模块的私有服务 |
| `<workspaceRoot>/modules/<module>/server/` | 与模块页面内聚的业务 API |
| `<workspaceRoot>/storage/` | 数据库、缓存和任务状态；不进入 Git 或 `<distRoot>/` |

## 服务发现

全局服务通过 `<workspaceRoot>/services/<id>/config.json` 声明：

```json
{
  "id": "example",
  "entry": "./index.mjs",
  "enabled": true
}
```

页面模块通过 `config.json` 声明运行模式：

```json
{
  "runtime": "server",
  "serverEntry": "./server/index.mjs"
}
```

入口必须导出 `createRoutes(context)`，返回具有 `method`、`path` 和 `handle` 的路由。宿主拒绝越过服务或模块目录的入口路径以及重复路由。

## 运行模式

- `static`：Markdown/HTML 在构建期生成静态页面，默认模式。
- `client`：页面仍进入 `<distRoot>/`，浏览器执行客户端逻辑。
- `server`：页面进入 `<distRoot>/`，同时由 `serverEntry` 注册运行时 API。

## 部署

Nginx 只公开 `<distRoot>/`，把 `/api/` 反向代理到默认监听 `127.0.0.1:4174` 的 `npm run api`。服务入口和 `<workspaceRoot>/storage/` 不能由 Nginx 静态发布。

## 安全边界

- 当前所选工作区是可信但私有的可执行扩展来源，不加载第三方不可信服务。
- 密钥只来自环境变量，不写入配置或浏览器产物。
- 管理接口必须独立认证；数据库和服务代码不进入 `<distRoot>/`。
- 命令执行使用固定可执行文件和参数，不接受客户端命令文本。

工作区与生成目录解析行为见[工作区与生成目录选择 spec](../../specs/workspace-selection.md)。
