# ADR-0002：构建期清单与通用静态路由

- Status: Accepted
- Date: 2026-08-05

## 背景

每新增一篇内容就生成一个 `src/pages/` 源文件，会产生中间代码、清理问题和内容/代码不同步风险。纯运行时扫描又不符合当前静态部署目标。

## 决定

- 构建期扫描 `data/` 并生成内存中的 `SiteManifest`。
- 使用 `src/pages/[module]/[...slug].astro` 和 `getStaticPaths()` 生成内容页面。
- 使用独立通用资源路由生成图标、HTML 和附件响应。
- 不向源码树写入按文章展开的页面代码。

## 后果

正面影响：

- 新增内容只修改 `data/`。
- URL 规则集中在内容加载器中测试和维护。
- 静态产物可部署到普通文件服务器。

代价：

- 每次内容修改必须重新执行构建。
- 构建时间随内容规模增长。
- 真正的私有内容和在线即时更新需要未来的服务端方案。

## 关联内容

- [架构概览](../architecture/overview.md)
- [内容与路由管线](../architecture/modules/content-pipeline.md)
