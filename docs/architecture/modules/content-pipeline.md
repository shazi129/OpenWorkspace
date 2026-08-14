# 内容与路由管线

## 职责

该模块把 `<workspaceRoot>/modules/` 转换为可供 Astro 构建使用的强类型清单、内容页面参数和资源页面参数。

## 主要文件

| 文件 | 职责 |
| --- | --- |
| `src/core/openworkspace-config.mjs` | 解析工作区、生成目录及输出安全边界 |
| `src/core/config-schema.ts` | 全局/模块配置 schema、默认值、相对路径格式 |
| `src/core/types.ts` | `ContentFile`、`ContentTreeNode`、`ModuleManifest` 等类型 |
| `src/core/content-loader.ts` | 文件扫描、边界校验、树生成、URL 和静态路由参数 |
| `src/core/content-metadata.ts` | 解析 `create`、规范化 `tags` 并提供旧文章默认值 |
| `src/content.config.ts` | 已发布模块的 Markdown 集合、Frontmatter schema 和 entry ID |
| `src/markdown/workspace-markdown-loader.ts` | 通过真实文件路径读取 Markdown，支持文件名中的 `#` |
| `src/pages/openworkspace-assets/[module]/[...path].ts` | 原始资源响应、安全响应头 |
| `src/pages/openworkspace-index/[module].json.ts` | 每个公开模块的精简内容索引 |

## 清单生成

`loadSiteManifest()` 是主要入口：

1. 解析当前工作区的 `<workspaceRoot>/config.json`。
2. 枚举 `<workspaceRoot>/modules/` 下的模块目录。
3. 要求目录名与模块 `id` 一致。
4. 排除 `publish: false` 或非 `public` 模块；保留只隐藏导航的 private 模块。
5. 相对模块目录校验 `contentDir`、`icon` 和字符串形式的 `index` 都位于模块内部；自定义首页必须存在，`contentDir` 不存在时按空目录处理，存在时必须是目录。
6. 读取 Markdown Frontmatter，将标题、`create` 和 `tags` 写入扁平 `contentFiles`，再生成递归 `tree` 和按时间排序的 `contentIndex`。
7. 先排列正数 `order` 顶部组，再排列负数底部组；同值按标题排序，并确认默认模块存在。

Astro 内容集合复用清单中的已发布模块范围，因此 `publish: false`、`authenticated` 和 `allowlist` 模块的 Markdown 不参与内容同步。工程自定义 loader 使用绝对文件路径读取正文，用 `pathToFileURL()` 提供渲染上下文，并把存入 Astro 的相对 `filePath` 按路径段编码，避免正文读取和相对图片解析时把文件名中的 `#` 误解为 URL fragment。

## 内容树规则

- 同级目录和文件按创建时间从近到远统一排序，时间相同时按中文数字感知名称排序。
- 文件节点的时间来自 `create`，缺少时使用 2000-01-01；目录节点的时间是后代文章中的最早值。
- `tags` 接受逗号分隔字符串、字符串数组或空值，缺少或为空时规范化为空数组。
- 非 Markdown/HTML 文件不进入目录树。
- 模块根 `index.md` 独立作为首页路由，不进入 `content/` 目录树。
- 空目录不展示。
- 模块只有首页时，`contentDir` 可以不存在，并生成空内容树。
- 一个目录过滤资源文件后只有一个内容文件时，省略该目录并提升文件节点。
- 折叠可以递归穿过多层单文件目录，但不会改变文件 `slug`、`href` 或真实路径。

行为契约见[目录树 spec](../../specs/directory-tree.md)。

## URL 与资源

- 未配置 `index` 时优先使用模块根目录的 `index.md`；该文件不存在时自动生成模块索引首页。`index` 也可配置为内容路径或生成式首页对象。
- 根首页映射到模块 URL；`content/` 首页沿用该文件 URL，并作为目录树默认定位。
- 每个公开发布模块生成 `/openworkspace-index/<module>.json`；自动首页复用同一份内容索引进行搜索、标签筛选和分页。
- 其他内容去掉扩展名并保留相对目录。
- 每个 URL 段独立进行百分号编码。
- 文件或目录名中的 `#` 保持原始文件名，并在公开 URL 中编码为 `%23`。
- 当前 Astro 静态路由不能处理文件名中的字面量 `%`；这类内容会导致生产构建失败，应避免用于发布内容路径。
- Markdown 由内容集合渲染；HTML 通过资源路由进入 iframe。
- 非 Markdown 资源可由 `/openworkspace-assets/<module>/<module-relative-path>` 访问。

## 不变量

- `WORKSPACE_ROOT` 由 `OPENWORKSPACE_WORKSPACE_ROOT`、根目录 `openworkspace.config.json`、内置 `workspace/` 依次选择；配置文件指向的路径不可用时回退到内置工作区。
- `services/`、模块 `server/` 和 `storage/` 不参与静态资源扫描。
- 路径进入清单前必须经过模块边界校验。
- 符号链接不进入内容或资源路由。
- `publish: false`、`authenticated` 和 `allowlist` 模块不能生成页面、导航或静态资源。
- `private: true` 只影响导航，模块页面和资源仍属于公开静态产物。
