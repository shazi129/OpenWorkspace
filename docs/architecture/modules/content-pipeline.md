# 内容与路由管线

## 职责

该模块把 `workspace/modules/` 转换为可供 Astro 构建使用的强类型清单、内容页面参数和资源页面参数。

## 主要文件

| 文件 | 职责 |
| --- | --- |
| `src/core/config-schema.ts` | 全局/模块配置 schema、默认值、相对路径格式 |
| `src/core/types.ts` | `ContentFile`、`ContentTreeNode`、`ModuleManifest` 等类型 |
| `src/core/content-loader.ts` | 文件扫描、边界校验、树生成、URL 和静态路由参数 |
| `src/content.config.ts` | Markdown 集合、Frontmatter schema 和 entry ID |
| `src/pages/openworkspace-assets/[module]/[...path].ts` | 原始资源响应、安全响应头 |

## 清单生成

`loadSiteManifest()` 是主要入口：

1. 解析 `workspace/config.json`。
2. 枚举 `workspace/modules/` 下的模块目录。
3. 要求目录名与模块 `id` 一致。
4. 排除非 `public` 模块。
5. 相对模块目录校验 `contentDir`、`icon` 和 `index` 都位于模块内部且存在。
6. 生成扁平 `contentFiles` 和递归 `tree`。
7. 按 `order`、标题排序模块，并确认默认模块存在。

## 内容树规则

- 目录排在文件之前，同类按中文数字感知排序。
- 非 Markdown/HTML 文件不进入目录树。
- 模块根 `index.md` 独立作为首页路由，不进入 `content/` 目录树。
- 空目录不展示。
- 一个目录过滤资源文件后只有一个内容文件时，省略该目录并提升文件节点。
- 折叠可以递归穿过多层单文件目录，但不会改变文件 `slug`、`href` 或真实路径。

行为契约见[目录树 spec](../../specs/directory-tree.md)。

## URL 与资源

- `index` 默认是模块根目录的 `index.md`；也可配置为 `content/` 下的内容文件。
- 根首页映射到模块 URL；`content/` 首页沿用该文件 URL，并作为目录树默认定位。
- 其他内容去掉扩展名并保留相对目录。
- 每个 URL 段独立进行百分号编码。
- Markdown 由内容集合渲染；HTML 通过资源路由进入 iframe。
- 非 Markdown 资源可由 `/openworkspace-assets/<module>/<module-relative-path>` 访问。

## 不变量

- `WORKSPACE_ROOT` 默认是运行目录下的 `workspace/`，可通过 `OPENWORKSPACE_WORKSPACE_ROOT` 覆盖。
- `services/`、模块 `server/` 和 `storage/` 不参与静态资源扫描。
- 路径进入清单前必须经过模块边界校验。
- 符号链接不进入内容或资源路由。
- 非公开模块不能生成页面、导航或静态资源。
