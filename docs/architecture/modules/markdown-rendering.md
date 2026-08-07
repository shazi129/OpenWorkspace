# Markdown 渲染模块

## 职责

该模块负责加载 Markdown entry、扩展 `[TOC]` 标记、生成文章目录并约束正文样式。

## 主要文件

| 文件 | 职责 |
| --- | --- |
| `astro.config.mjs` | 配置 Sätteri Markdown processor |
| `src/content.config.ts` | Markdown 文件发现和 Frontmatter schema |
| `src/markdown/workspace-markdown-loader.ts` | 已发布 Markdown 的文件读取、内容存储和 `#` 路径处理 |
| `src/markdown/toc-marker.ts` | MDAST 阶段识别 `[TOC]` 并写入元数据 |
| `src/pages/[module]/[...slug].astro` | 获取 entry、render 结果和 headings |
| `src/components/ArticleToc.astro` | 把 headings 转为文章内导航 |
| `src/styles/global.css` | TOC 响应式布局和正文图片宽度 |

## `[TOC]` 流程

1. Sätteri 访问 Markdown 段落节点。
2. 独立且忽略大小写的 `[TOC]` 段落被移除。
3. 插件在 Astro 渲染元数据中写入 `openWorkspaceToc`。
4. 内容页面同时要求该元数据为真且存在二级以上标题。
5. `ArticleToc` 使用 Astro 已生成的 heading slug，避免重新实现锚点算法。

普通正文或代码块中的 `[TOC]` 不应触发目录。详细行为见[Markdown TOC spec](../../specs/markdown-toc.md)。

## 布局和图片

- 宽内容区域中，文章 TOC 位于正文左侧并保持 sticky。
- 内容区域较窄时，TOC 移到正文上方并限制高度。
- TOC 展示二级及更深标题，并按 heading depth 缩进。
- Markdown 图片使用 `width: 100%` 和 `height: auto`，填满正文行宽并保持比例。
- 标题设置 `scroll-margin-top`，锚点跳转后不会紧贴视口顶部。

## Frontmatter 现状

支持 `title`、`description`、`order` 和 `draft`。当前只有 `title` 用作页面标题；`order` 和 `draft` 尚未驱动目录排序或发布过滤。

## 文件路径

Markdown loader 从内容清单取得绝对文件路径，直接读取文件后再通过 `pathToFileURL()` 传给 Astro 渲染器；存入内容集合的相对 `filePath` 按路径段编码，供 Astro 正确解析同目录图片。因此 `#` 不会被当作 URL fragment，entry ID 和网页 URL 仍按真实相对路径生成。
