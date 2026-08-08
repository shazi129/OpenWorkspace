# Markdown LaTeX 公式

- Status: Implemented
- Updated: 2026-08-08

## 背景

Sätteri 可以识别 Markdown 中的数学节点，但默认不开启，且启用后只生成带数学语言标记的代码节点。文章需要在静态构建阶段把这些节点转换为浏览器可显示的公式。

## 目标

- 支持 `$...$` 行内公式和独立 `$$...$$` 块级公式。
- 在构建阶段生成公式 HTML，不要求浏览器执行额外 JavaScript。
- 同时生成 MathML，保留屏幕阅读器可访问的公式语义。
- 超宽块级公式在正文区域内横向滚动，不撑破页面布局。
- 兼容旧文章在外层公式中嵌套 `$...$` 的写法以及不可见零宽字符。

## 非目标

- 支持完整 TeX 宏包集合。
- 在浏览器中动态编译用户输入的公式。
- 把 `math` fenced code block 当成公式；它仍是代码示例。

## 行为要求

1. `$E=mc^2$` 渲染为行内公式。
2. `$$ ... $$` 渲染为块级公式；推荐让分隔符单独占行，便于阅读和编辑。
3. KaTeX 输出使用 HTML 与 MathML 双重结构。
4. 无效或 KaTeX 不支持的表达式不应中断整个站点构建，而应显示原表达式和错误提示。
5. fenced code block 中的数学文本不参与公式渲染。
6. 正文中的美元符号使用 `\$` 转义，避免与行内公式分隔符冲突。
7. 块级公式最大宽度不超过正文，内容过宽时可以横向滚动。

## 验收条件

- 包含行内和块级公式的页面在 `dist/` 中出现 KaTeX 与 MathML 标记。
- 最终公式节点不再保留 `language-math math-inline` 或 `language-math math-display` 占位标记。
- KaTeX 字体与样式进入静态构建产物。
- `tests/unit/markdown-math.test.ts` 覆盖行内公式、块级公式、代码块和旧格式归一化。
- `npm run check`、`npm test`、`npm run build` 通过。

## 关联模块

- [Markdown 渲染模块](../architecture/modules/markdown-rendering.md)
