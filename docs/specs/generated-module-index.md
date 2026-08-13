# 模块自动索引首页

- Status: Implemented
- Updated: 2026-08-13

## 目标

- 在模块没有自定义首页时，根据公开内容自动生成模块首页。
- 为每个已发布模块生成精简的内容元数据索引。
- 按创建时间从近到远分页展示 Markdown 和 HTML，并支持标题搜索与标签筛选。
- 保持已有 `index.md` 和显式首页路径兼容。

## 行为要求

1. 模块 `index` 为字符串时，继续使用相对于模块目录的 Markdown 或 HTML 首页。
2. 模块未配置 `index` 且根目录存在 `index.md` 时，继续使用该文件。
3. 模块未配置 `index` 且根目录不存在 `index.md` 时，在模块根 URL 自动生成索引首页。
4. `index: { "type": "generated", "pageSize": 20 }` 强制使用自动首页；`pageSize` 默认为 `20`，范围是 `1` 到 `100`。
5. 自动首页只写入 `<distRoot>/`，不能在工作区中创建或覆盖源文件。
6. 每个公开发布模块在 `/openworkspace-index/<module>.json` 生成索引；记录包含 `title`、`href`、`kind`、`create` 和 `tags`，不包含正文。
7. `publish: false`、`authenticated` 和 `allowlist` 模块不生成页面或索引；`private: true` 仍属于公开发布内容。
8. Markdown 标题优先读取 Frontmatter `title`，缺少时使用文件名；HTML 使用文件名。
9. Markdown 缺少或留空 `create` 时使用 `2000-01-01T00:00:00.000Z`；HTML 使用同一默认时间。
10. `tags` 支持逗号分隔字符串、字符串数组、缺省值和空值；缺少或留空时规范化为空数组，HTML 默认没有标签。
11. 首页先按 `create` 倒序排列，时间相同时按标题排序。
12. 搜索词匹配标题或标签；标签下拉框执行精确筛选；筛选结果重新分页。
13. `q`、`tag` 和 `page` 使用 URL 查询参数保存，刷新和分享链接后可恢复当前筛选状态。

## 验收条件

- 删除模块根 `index.md` 后，模块根 URL 仍生成可访问的 `index.html`。
- 自定义首页、约定的根 `index.md` 和显式生成模式均有单元测试覆盖。
- 默认时间、空标签、标题回退、时间排序和 JSON 索引有单元测试覆盖。
- 自动首页在没有 JavaScript 时至少展示第一页；启用 JavaScript 后可搜索、筛选和分页。
- `npm test`、`npm run check` 和 `npm run build` 通过。

## 关联模块

- [内容与路由管线](../architecture/modules/content-pipeline.md)
- [工作区 UI](../architecture/modules/workspace-ui.md)
- [内容目录树](directory-tree.md)
