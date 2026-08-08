# Markdown `[TOC]` 与正文图片

- Status: Implemented
- Updated: 2026-08-08

## 背景

已有文章使用独立 `[TOC]` 标记表达“在此文章启用目录”。默认 Markdown 会把它渲染成普通文本，需要框架识别标记并使用已有标题锚点生成导航。

## 目标

- 兼容已有独立 `[TOC]` 写法。
- 复用 Markdown renderer 生成的标题 slug。
- 在宽屏把文章目录放在正文左上侧并随滚动保持可用。
- 在窄屏避免 TOC 挤压正文。
- 文章图片与正文行宽一致并保持比例。
- 兼容单独一行的原生 HTML `<img>` 写法及其自定义属性。

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
8. 单独一行的原生 HTML `<img>` 在 Markdown 构建阶段转为标准图片节点；相对 `src` 按当前文章目录解析，`alt`、`title`、`style` 等属性予以保留。
9. 包含其他元素的通用或混合 HTML 片段不做图片节点转换。

## 验收条件

- 构建后的文章不包含 `<p>[TOC]</p>`。
- TOC 中每个链接能指向对应标题 ID。
- 没有标记的 Markdown 页面不出现文章 TOC。
- `tests/unit/toc-marker.test.ts` 覆盖标记识别、元数据和节点移除。
- `tests/unit/raw-html-image.test.ts` 覆盖原生图片识别、属性保留和非目标 HTML。
- 构建后的原生相对图片使用 Astro 生成的资源地址，不保留无法访问的文章路由相对地址。
- `npm run check`、`npm test`、`npm run build` 通过。

## 关联模块

- [Markdown 渲染模块](../architecture/modules/markdown-rendering.md)
