# OpenWorkspace 工程快速上下文

> 面向所有编码 Agent 和新贡献者的快速入口。这里只保留稳定、高价值的信息；详细内容通过 `INDEX.md` 按需读取。

## 工程目标

OpenWorkspace 是一个由工作空间驱动的个人网站框架。仓库内的 `workspace/` 提供可运行示例；维护者也可以通过根目录配置选择外部私有工作区，在其中添加模块、Markdown、HTML、客户端页面和私有服务。框架把静态站点生成到可配置的 `<distRoot>/`，可选 API 宿主运行服务端模块。

核心原则：

- 当前选中的工作区是用户模块、内容、服务和实例部署配置的唯一事实来源；内置 `workspace/` 是默认示例。
- `src/server/` 只提供通用 HTTP 宿主，不承载用户业务 API。
- 所选工作区的 `storage/` 永远不进入 Git 或 `<distRoot>/`。
- 展示框架不接管或复制用户正文。
- 内容错误应在构建阶段暴露，不能静默生成残缺页面。
- 当前阶段保持纯静态输出；私有内容必须等待服务端认证方案，不能仅靠前端隐藏。

## 当前功能

- 按环境变量、`openworkspace.config.json`、内置 `workspace/` 的优先级选择工作区根目录，并通过同一配置选择静态生成目录和构建主题。
- 页面结构样式与主题变量分离；默认 `normal` 保持浅色外观，`dark` 提供深褐背景主题。
- 从 `<workspaceRoot>/config.json` 和 `<workspaceRoot>/modules/<module>/config.json` 加载站点及模块配置。
- 模块支持 `static`、`client`、`server` 三种运行模式；服务端模块通过 `serverEntry` 注册 API。
- `<workspaceRoot>/services/` 提供不属于单个模块的全局私有服务。
- 使用 Zod 校验配置、模块 ID、访问级别和相对路径。
- 扫描 Markdown、HTML 及配套资源，生成静态内容和资源路由。
- 生成模块导航和递归目录树；只有一个内容文件的目录会被折叠。
- 模块 `order` 支持正数从顶部排序、负数从底部排序，`0` 无效。
- 模块 `private` 控制是否隐藏工具栏入口，`publish` 控制是否进入静态构建。
- 目录树支持节点类型图标、展开状态、单行省略、拖动调整宽度和整体收起。
- 文章支持 `create` 和可为空的 `tags` 元数据；缺少时间时使用 2000-01-01，目录树按文章或目录创建时间从近到远排列。
- 模块没有根 `index.md` 时自动生成可按标题和标签搜索、分页的内容首页，并输出公开模块 JSON 索引。
- Markdown 支持标题锚点、独立 `[TOC]` 文章目录以及 `$...$` / `$$...$$` LaTeX 公式。
- Markdown 图片按正文宽度缩放并保持比例；单独一行的原生 HTML `<img>` 也支持相对路径和自定义属性。
- HTML 工具通过带 CSP 的资源路由和沙箱 iframe 展示。
- 桌面端使用双侧栏布局，移动端使用模块抽屉和顶部目录区域。

## 数据流

```text
<workspaceRoot>/config.json + <workspaceRoot>/modules/<module>/**
                │
                ▼
config-schema.ts + content-loader.ts
                │
                ▼
SiteManifest / ContentRouteProps / ContentIndexEntry / RawAssetRouteProps
                │
       ┌────────┴─────────┐
       ▼                  ▼
Astro 内容页面         静态资源路由
       │                  │
       └────────┬─────────┘
                ▼
          <distRoot>/
```

## 关键入口

| 领域 | 入口文件 | 职责 |
| --- | --- | --- |
| 框架根配置 | `src/core/openworkspace-config.mjs` | 解析工作区根目录、静态生成目录、构建主题及安全边界 |
| 配置模型 | `src/core/config-schema.ts` | Zod schema、默认值和路径格式校验 |
| 内容清单 | `src/core/content-loader.ts`、`src/core/content-metadata.ts` | 扫描模块、读取文章元数据、生成内容树、页面路由和资源路由 |
| 核心类型 | `src/core/types.ts` | 清单、内容文件、目录树和路由类型 |
| Markdown 集合 | `src/content.config.ts` | Astro Content Collection 加载和 Frontmatter schema |
| Markdown 加载 | `src/markdown/workspace-markdown-loader.ts` | 从工作区真实路径读取已发布 Markdown 并处理文件名中的 `#` |
| Markdown 扩展 | `src/markdown/toc-marker.ts`、`src/markdown/math-renderer.ts`、`src/markdown/raw-html-image.ts` | 处理 `[TOC]`、LaTeX 和原生 HTML 图片兼容 |
| 内容页面 | `src/pages/[module]/[...slug].astro` | Markdown、HTML 和自动索引首页路由渲染 |
| 自动索引 | `src/components/GeneratedModuleIndex.astro`、`src/pages/openworkspace-index/[module].json.ts` | 内容搜索、标签筛选、分页和公开 JSON 索引 |
| 资源页面 | `src/pages/openworkspace-assets/[module]/[...path].ts` | 图标、附件和 HTML 资源响应 |
| 工作区布局 | `src/layouts/WorkspaceLayout.astro` | 模块抽屉、目录栏拖动和收起交互 |
| 目录树 | `src/components/DirectoryTree.astro` | 递归目录及当前页面状态 |
| 文章目录 | `src/components/ArticleToc.astro` | 根据 Markdown headings 生成文章 TOC |
| 全局样式 | `src/styles/global.css` | 桌面、移动端、目录树、正文和 TOC 的共享结构样式 |
| 构建主题 | `themes/<name>/theme.css` | 颜色、表面、边框、阴影和图标滤镜变量 |

## 目录职责

| 路径 | 所有者与用途 |
| --- | --- |
| `workspace/` | 随框架发布的默认示例工作区；可由外部 `workspaceRoot` 整体替代 |
| `<workspaceRoot>/modules/` | 模块、页面、正文、附件和模块专属服务 |
| `<workspaceRoot>/services/` | 不属于单个模块的全局私有服务 |
| `<workspaceRoot>/storage/` | 数据库、缓存和任务状态；不发布、不提交 |
| `<workspaceRoot>/deploy/` | 当前实例的 Nginx、systemd 等部署配置；不进入静态构建 |
| `src/` | 框架维护者；加载、路由、组件、交互和样式 |
| `tests/unit/` | 配置、内容树和 Markdown 扩展测试 |
| `tests/e2e/` | 预留端到端测试目录 |
| `docs/` | 公共工程知识、架构、spec 和 ADR |
| `设计文档/` | UI 原始设计、图片和 draw.io 源文件 |
| `themes/` | 框架构建主题；默认提供 `normal` 和 `dark` |
| `<distRoot>/` | Astro 生产构建产物；默认是框架根目录 `dist/`，可指向外部目录 |
| `.astro/` | Astro 生成的内容与类型缓存，不直接编辑 |

## 稳定约束

- 支持的内容扩展名是 `.md`、`.html` 和 `.htm`。
- 模块目录名必须与配置中的 `id` 一致。
- 配置路径必须留在所属模块目录内，符号链接不参与扫描。
- 根配置的 `theme` 默认是 `normal`，只能选择包含 `theme.css` 的合法主题目录；主题切换需要重新构建。
- 模块首页优先读取根 `index.md`，也可显式指向内容文件；根首页不存在时自动生成内容索引页，`index.type` 可强制使用生成模式。
- 文件相对路径决定 URL；移动或重命名内容会改变外部链接。
- `authenticated` 和 `allowlist` 当前只表示“不进入静态构建”，尚未实现登录访问。
- `private: true` 只隐藏导航，页面仍在 `<distRoot>/` 中，不能用于保护敏感内容。
- Frontmatter 的 `create` 控制目录树和自动首页排序，缺省为 2000-01-01；`tags` 缺省为空数组；`order` 和 `draft` 已进入 schema，但当前尚未控制排序或发布。

## 环境与命令

- Node.js：`>= 22.22.2`
- npm：`>= 10.0.0`

```bash
npm run context   # 本文档 + 当前 Git 状态 + 最近提交
npm run dev       # 本地开发服务器
npm run check     # Astro/TypeScript 检查
npm test          # Vitest 单元测试
npm run build     # 检查并生成 <distRoot>/
npm run preview   # 预览生产构建
npm run api       # 启动 workspace 私有服务宿主
```

## 当前非目标

- 数据库存储 Markdown。
- 静态构建中的真正私有页面。
- `draft: true` 自动排除发布。
- 按 Frontmatter `order` 排序目录树。
- 服务端上传内容后无需构建即时生效。

下一步根据任务类型查阅 [`INDEX.md`](INDEX.md)。
