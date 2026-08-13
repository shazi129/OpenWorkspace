# Changelog

本文件记录用户可见的功能变化。精确文件修改和实现历史以 Git 为准。

## Unreleased

### Added

- 建立 Codex 与 CodeBuddy 共用的工程知识库、薄适配入口、spec 和 ADR 目录。
- 增加 `npm run context`，用于输出工程快速上下文、当前工作区状态和最近提交。
- 目录树增加文件夹和文档图标，便于快速区分目录与内容文件。
- 工具栏内置模块图标统一为轻量线性风格，并使用橙色突出当前模块。
- 模块首页默认改为模块根 `index.md`，并支持将 `content/` 文件配置为首页和目录树默认定位。
- 目录树站内跳转会保留已展开的兄弟目录，直接链接访问仍只展开当前路径。
- 增加通用 API 宿主、私有全局服务发现和服务端模块 `serverEntry`。
- 模块增加 `private` 导航隐藏和 `publish` 静态发布开关。
- Markdown 文件和目录名称支持 `#`，构建时保持原有内容路径和编码 URL，同目录图片也能正确加载。
- 只有模块首页时允许省略空的 `contentDir`，避免 Git 部署后因空目录丢失导致构建失败。
- Markdown 增加 `$...$` 和 `$$...$$` LaTeX 公式渲染，静态输出包含 KaTeX HTML、MathML、样式和字体。
- Markdown 中单独一行的原生 HTML `<img>` 支持相对图片路径，并在构建时保留自定义样式和属性。
- 文章增加 `create` 和 `tags` 元数据，目录树按文章及目录创建时间从近到远排列。
- 模块缺少自定义首页时自动生成按时间排序的分页内容首页，支持标题与标签搜索，并为公开模块输出精简 JSON 索引。
- 新增 `scripts/preview.bat`，通过 fnm 自动切换 Node 版本后构建并启动预览。
- 新增 `scripts/install.bat`，一键安装 fnm、Node 版本及项目依赖。
- 安装文档补充 Windows 下 fnm 安装方式。
- 增加 `openworkspace.config.json`，可通过 `workspaceRoot` 选择外部工作区，并通过 `distRoot` 分离静态生成物；默认继续使用内置示例和根目录 `dist/`。

### Changed

- 内容缺少 `create` 时默认使用 2000-01-01；`tags` 允许缺少或留空并规范化为空数组。
- 将文章路径中的半角 `%` 调整为全角 `％`，避开 Astro 静态路由的百分号解码限制。
- 私有内容根目录由 `data/` 调整为 `workspace/`，模块统一移动到 `workspace/modules/`。
- 模块配置增加 `static`、`client`、`server` 三种运行模式。
- 模块导航 `order` 支持正数顶部排序与负数底部排序，`-1` 表示最靠近底部。
- 部署配置从框架根目录迁入 `<workspaceRoot>/deploy/`，内置工作区与外部私有工作区保持相同结构。

### Fixed

- 将 Markdown 中的 Windows 图片路径改为跨平台相对路径，修复 Linux 构建时的 `ImageNotFound`。
- 批量修正 articles 模块下 28 篇文章的 frontmatter 格式（旧格式 `Title:/Date:/Category:/Tags:` → 标准 YAML `create` + `tags`）。
- 修正文章中 `#` 后无空格、Tab 缩进代码块、`@(...)[...]` 非标准语法等 Markdown 格式问题。
- 修正 `梦蝶.md` frontmatter 日期缺少空格的问题。
- 新增 `games` 模块，内置 flappy bird 小游戏，支持纯 Canvas 绘制。
- 新增 `favorites` 模块，分类收藏常用网站链接。
- 新增 `scripts/build-module.bat`，支持按模块过滤构建（`OPENWORKSPACE_BUILD_MODULES`）。
- 支持 `OPENWORKSPACE_BUILD_MODULES` 环境变量，可按逗号分隔的模块 ID 列表选择性构建。
- 部分构建时首页自动重定向到第一个可用模块。
- `tsconfig.json` 排除 `workspace/` 目录，避免对内容文件做 TypeScript 检查。

### Changed

- `tools` 模块首页改为 `index.md`，去掉指向不存在的 `content/index.html` 的 index 字段。

### Fixed

- `package-lock.json` 缺失 `@types/js-yaml` 导致 `npm ci` 失败，改用 `npm install`。
- `scripts/install.bat` 文件编码改为纯 ASCII，修复 Windows CMD 下乱码报错。

## 2026-08-07

### Added

- 目录节点增加类似 VS Code 的展开三角。
- 目录树支持拖动调整宽度、键盘调整以及整体展开/收起。
- 目录宽度和收起状态保存在浏览器本地。
- Markdown 支持独立 `[TOC]` 标记生成文章目录。
- 文章目录在宽屏位于正文左侧，在窄屏移动到正文上方。

### Changed

- 目录树文件名保持单行，超长时省略并可查看完整名称。
- 只有一个内容文件的目录在展示时自动折叠，文件 URL 保持不变。
- Markdown 图片缩放到正文行宽并保持宽高比。

## 2026-08-06

### Added

- 增加完整技术方案和安装、内容创作、Nginx 部署文档。

## 2026-08-05

### Added

- 建立 Astro 静态站点框架。
- 支持站点配置、模块配置、Markdown、HTML 和静态资源路由。
- 支持模块导航、内容目录树、移动端模块抽屉和自定义 404 页面。
