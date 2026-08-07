# OpenWorkspace 工程快速上下文

> 面向所有编码 Agent 和新贡献者的快速入口。这里只保留稳定、高价值的信息；详细内容通过 `INDEX.md` 按需读取。

## 工程目标

OpenWorkspace 是一个由私有工作空间驱动的个人网站框架。维护者在 `workspace/` 中添加模块、Markdown、HTML、客户端页面和私有服务；框架生成 `dist/` 静态站点，可选 API 宿主运行服务端模块。

核心原则：

- `workspace/` 是用户模块、内容和服务的唯一事实来源。
- `src/server/` 只提供通用 HTTP 宿主，不承载用户业务 API。
- `workspace/storage/` 永远不进入 Git 或 `dist/`。
- 展示框架不接管或复制用户正文。
- 内容错误应在构建阶段暴露，不能静默生成残缺页面。
- 当前阶段保持纯静态输出；私有内容必须等待服务端认证方案，不能仅靠前端隐藏。

## 当前功能

- 从 `workspace/config.json` 和 `workspace/modules/<module>/config.json` 加载站点及模块配置。
- 模块支持 `static`、`client`、`server` 三种运行模式；服务端模块通过 `serverEntry` 注册 API。
- `workspace/services/` 提供重新生成等全局私有服务。
- 使用 Zod 校验配置、模块 ID、访问级别和相对路径。
- 扫描 Markdown、HTML 及配套资源，生成静态内容和资源路由。
- 生成模块导航和递归目录树；只有一个内容文件的目录会被折叠。
- 目录树支持节点类型图标、展开状态、单行省略、拖动调整宽度和整体收起。
- Markdown 支持标题锚点及独立 `[TOC]` 标记生成的文章目录。
- Markdown 图片按正文宽度缩放并保持比例。
- HTML 工具通过带 CSP 的资源路由和沙箱 iframe 展示。
- 桌面端使用双侧栏布局，移动端使用模块抽屉和顶部目录区域。

## 数据流

```text
workspace/config.json + workspace/modules/<module>/**
                │
                ▼
config-schema.ts + content-loader.ts
                │
                ▼
SiteManifest / ContentRouteProps / RawAssetRouteProps
                │
       ┌────────┴─────────┐
       ▼                  ▼
Astro 内容页面         静态资源路由
       │                  │
       └────────┬─────────┘
                ▼
              dist/
```

## 关键入口

| 领域 | 入口文件 | 职责 |
| --- | --- | --- |
| 配置模型 | `src/core/config-schema.ts` | Zod schema、默认值和路径格式校验 |
| 内容清单 | `src/core/content-loader.ts` | 扫描模块、内容树、页面路由和资源路由 |
| 核心类型 | `src/core/types.ts` | 清单、内容文件、目录树和路由类型 |
| Markdown 集合 | `src/content.config.ts` | Astro Content Collection 加载和 Frontmatter schema |
| Markdown 扩展 | `src/markdown/toc-marker.ts` | 识别并移除 `[TOC]`，写入渲染元数据 |
| 内容页面 | `src/pages/[module]/[...slug].astro` | Markdown/HTML 路由渲染 |
| 资源页面 | `src/pages/openworkspace-assets/[module]/[...path].ts` | 图标、附件和 HTML 资源响应 |
| 工作区布局 | `src/layouts/WorkspaceLayout.astro` | 模块抽屉、目录栏拖动和收起交互 |
| 目录树 | `src/components/DirectoryTree.astro` | 递归目录及当前页面状态 |
| 文章目录 | `src/components/ArticleToc.astro` | 根据 Markdown headings 生成文章 TOC |
| 全局样式 | `src/styles/global.css` | 桌面、移动端、目录树、正文和 TOC 样式 |

## 目录职责

| 路径 | 所有者与用途 |
| --- | --- |
| `workspace/modules/` | 私有模块、页面、正文、附件和模块专属服务 |
| `workspace/services/` | 重新生成等全局私有服务 |
| `workspace/storage/` | 数据库、缓存和任务状态；不发布、不提交 |
| `src/` | 框架维护者；加载、路由、组件、交互和样式 |
| `tests/unit/` | 配置、内容树和 Markdown 扩展测试 |
| `tests/e2e/` | 预留端到端测试目录 |
| `docs/` | 公共工程知识、架构、spec 和 ADR |
| `deploy/` | Nginx 反向代理与 systemd 常驻服务示例 |
| `设计文档/` | UI 原始设计、图片和 draw.io 源文件 |
| `dist/` | Astro 生产构建产物，不进入版本控制 |
| `.astro/` | Astro 生成的内容与类型缓存，不直接编辑 |

## 稳定约束

- 支持的内容扩展名是 `.md`、`.html` 和 `.htm`。
- 模块目录名必须与配置中的 `id` 一致。
- 配置路径必须留在所属模块目录内，符号链接不参与扫描。
- 模块首页默认读取模块根 `index.md`；也可指向 `content/` 文件，根首页不进入目录树。
- 文件相对路径决定 URL；移动或重命名内容会改变外部链接。
- `authenticated` 和 `allowlist` 当前只表示“不进入静态构建”，尚未实现登录访问。
- Frontmatter 的 `order` 和 `draft` 已进入 schema，但当前尚未控制排序或发布。

## 环境与命令

- Node.js：`>= 22.22.2`
- npm：`>= 10.0.0`

```bash
npm run context   # 本文档 + 当前 Git 状态 + 最近提交
npm run dev       # 本地开发服务器
npm run check     # Astro/TypeScript 检查
npm test          # Vitest 单元测试
npm run build     # 检查并生成 dist/
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
