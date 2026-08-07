# 私有工作空间

`workspace/` 是 OpenWorkspace 使用者主要维护的私有工作空间。

- `config.json`：网站级配置。
- `modules/`：页面模块、内容、客户端代码和模块专属服务。
- `services/`：工作区更新等不属于单个页面模块的全局服务。
- `storage/`：数据库、缓存和任务状态，禁止进入 Git 和 `dist/`。
- 模块必须包含 `config.json` 才会被识别。
- 模块 `order` 使用正数从顶部排序，使用负数从底部排序；`-1` 最靠近底部，不能使用 `0`。
- 模块 `private: true` 时隐藏工具栏入口但仍生成页面；`publish: false` 时完全不进入静态构建。
- 内置 `modules/settings/` 是只能通过 `/settings/` 访问的 private 客户端模块，当前提供工作区更新。
- 模块内容默认放在 `content/` 中，支持 Markdown 和 HTML。
- 修改内容后运行 `npm run dev` 预览，运行 `npm run build` 生成 `dist/`。

`src/` 属于框架实现，普通内容使用者不需要修改。
