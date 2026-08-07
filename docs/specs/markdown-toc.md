# Markdown `[TOC]` 与正文图片

- Status: Implemented
- Updated: 2026-08-07

## 背景

已有文章使用独立 `[TOC]` 标记表达“在此文章启用目录”。默认 Markdown 会把它渲染成普通文本，需要框架识别标记并使用已有标题锚点生成导航。

## 目标

- 兼容已有独立 `[TOC]` 写法。
- 复用 Markdown renderer 生成的标题 slug。
- 在宽屏把文章目录放在正文左上侧并随滚动保持可用。
- 在窄屏避免 TOC 挤压正文。
- 文章图片与正文行宽一致并保持比例。

## 非目标

- 没有 `[TOC]` 时自动为所有文章生成目录。
- 为 HTML 工具生成文章目录。
- 重新实现 Markdown 标题 ID 算法。
- 目录滚动监听和当前章节高亮。

## 行为要求

1. 独立段落 `[TOC]` 忽略大小写和前后空白。
2. 标记从最终正文中移除。
3. 正文句子或代码中的 `[TOC]` 不触发目录。
4. 只有存在标记且存在二级及更深标题时才渲染文章目录。
5. TOC 链接使用 Astro render 结果中的 heading slug。
6. 宽内容区域使用左侧 sticky 目录；窄内容区域将目录放到正文上方。
7. Markdown 图片宽度为正文可用宽度，高度自动计算。

## 验收条件

- 构建后的文章不包含 `<p>[TOC]</p>`。
- TOC 中每个链接能指向对应标题 ID。
- 没有标记的 Markdown 页面不出现文章 TOC。
- `tests/unit/toc-marker.test.ts` 覆盖标记识别、元数据和节点移除。
- `npm run check`、`npm test`、`npm run build` 通过。

## 关联模块

- [Markdown 渲染模块](../architecture/modules/markdown-rendering.md)
