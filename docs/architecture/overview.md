# OpenWorkspace 架构概览

## 系统边界

OpenWorkspace 在构建期读取私有工作空间，把公开页面转换成静态站点。`static`/`client` 模块可只发布 `dist/`；`server` 模块和全局服务由可选 Node API 宿主运行。

```text
内容维护边界                         框架实现边界

workspace/                           src/
├─ config.json                       ├─ core/
├─ modules/<module>/**/*   ───────▶  ├─ components/
├─ services/**/*                     ├─ layouts/
└─ storage/                          ├─ markdown/
                                     ├─ pages/
                                     └─ server/
                                              │
                                              ▼
                                            dist/
```

## 构建阶段

1. `config-schema.ts` 解析并校验全局及模块配置。
2. `content-loader.ts` 扫描 `public` 模块，生成 `SiteManifest`。
3. 内容加载器同时生成 Markdown/HTML 页面参数与原始资源参数。
4. Astro Content Collection 加载 Markdown，Sätteri 处理 Markdown 扩展和图片。
5. 动态页面模板通过 `getStaticPaths()` 生成所有静态 URL。
6. Astro 将页面、资源和优化图片输出到 `dist/`。

## 页面组成

```text
BaseLayout
└─ WorkspaceLayout
   ├─ ModuleNavigation + SettingsControl
   └─ workspace-main
      ├─ DirectoryTree（按模块配置启用）
      └─ content-panel
         ├─ ArticleToc + MarkdownContent
         └─ sandbox iframe（HTML 内容）
```

## 安全边界

- 只扫描模块目录内部的路径，拒绝绝对路径和 `../` 逃逸。
- 忽略符号链接，避免扫描到预期目录之外。
- 当前只构建 `access: "public"` 的模块。
- HTML 工具运行在 sandbox iframe 中，资源响应附带 CSP 和 `nosniff`。
- 静态站点无法提供真正私有内容；认证模块必须由未来的服务端方案实现。
- Nginx不得把 `workspace/services/`、模块 `server/` 或 `workspace/storage/` 作为静态目录发布。

## 模块文档

- [内容与路由管线](modules/content-pipeline.md)
- [工作区 UI](modules/workspace-ui.md)
- [Markdown 渲染](modules/markdown-rendering.md)
- [私有服务运行时](modules/service-runtime.md)

完整配置、路由和部署设计见[技术方案](../技术方案.md)。
