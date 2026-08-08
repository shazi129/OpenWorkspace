# 工程文档索引

根据任务读取必要文档，避免一次性加载全部内容。

## 按任务导航

| 任务 | 必读文档 | 主要代码 |
| --- | --- | --- |
| 理解整体架构 | [`CONTEXT.md`](CONTEXT.md)、[`架构概览`](../architecture/overview.md) | `src/core/`、`src/pages/` |
| 修改站点或模块配置 | [`模块发布 spec`](../specs/module-publication.md)、[`内容加载模块`](../architecture/modules/content-pipeline.md)、[`技术方案`](../技术方案.md) | `src/core/config-schema.ts` |
| 修改内容扫描、文章元数据、目录排序或 URL | [`目录树 spec`](../specs/directory-tree.md)、[`内容加载模块`](../architecture/modules/content-pipeline.md) | `src/core/content-loader.ts`、`src/core/content-metadata.ts`、`src/markdown/workspace-markdown-loader.ts` |
| 修改模块导航排序、可见性或布局 | [`模块导航 spec`](../specs/module-navigation.md)、[`模块发布 spec`](../specs/module-publication.md)、[`工作区 UI`](../architecture/modules/workspace-ui.md) | `ModuleNavigation.astro`、`content-loader.ts`、`global.css` |
| 修改目录树布局与交互 | [`目录树 spec`](../specs/directory-tree.md)、[`工作区 UI`](../architecture/modules/workspace-ui.md) | `WorkspaceLayout.astro`、`DirectoryTree.astro`、`global.css` |
| 修改 Markdown、图片、`[TOC]` 或 LaTeX | [`Markdown TOC spec`](../specs/markdown-toc.md)、[`Markdown LaTeX spec`](../specs/markdown-math.md)、[`Markdown 渲染模块`](../architecture/modules/markdown-rendering.md) | `workspace-markdown-loader.ts`、`toc-marker.ts`、`math-renderer.ts`、`raw-html-image.ts`、`[...slug].astro`、`ArticleToc.astro` |
| 修改 HTML 工具或资源安全 | [`内容加载模块`](../architecture/modules/content-pipeline.md)、[`技术方案`](../技术方案.md) | `openworkspace-assets/.../[...path].ts` |
| 添加文章、模块或部署站点 | [`安装与内容创作`](../安装文档.md)、[`workspace 说明`](../../workspace/README.md) | `workspace/`、`deploy/` |
| 修改 API、动态模块或设置中的更新服务 | [`服务运行时`](../architecture/modules/service-runtime.md)、[`设置更新 spec`](../specs/rebuild-settings.md) | `src/server/`、`WorkspaceUpdateClient.astro`、`workspace/services/` |
| 修改移动端或视觉设计 | [`工作区 UI`](../architecture/modules/workspace-ui.md)、[`原始设计文档`](../../设计文档/设计文档.md) | `WorkspaceLayout.astro`、`global.css` |
| 了解设计原因 | [`ADR 索引`](../adr/README.md) | 相关 Git 历史 |
| 了解近期变化 | [`CHANGELOG`](../../CHANGELOG.md)、运行 `npm run context` | `git log`、`git show` |

## 文档类型边界

- `CONTEXT.md`：稳定的工程摘要和入口。
- `architecture/`：当前实现结构和模块边界。
- `specs/`：功能行为、非目标和验收条件。
- `adr/`：重要设计选择及其原因。
- `CHANGELOG.md`：用户可见的变化摘要。
- Git：精确到文件和代码行的历史事实。

如果文档和代码不一致，以已验证的当前代码为准，并在本次任务中修正文档。
