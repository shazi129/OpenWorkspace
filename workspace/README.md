# 默认示例工作区

`workspace/` 是随 OpenWorkspace 发布的可运行示例，也是没有其他配置时的默认工作区。真实内容可以保存在外部目录或独立私有仓库，再通过根目录 `openworkspace.config.json` 的 `workspaceRoot` 选择。

- `config.json`：网站级配置。
- `modules/`：页面模块、内容、客户端代码和模块专属服务。
- `services/`：不属于单个页面模块的全局私有服务。
- `storage/`：数据库、缓存和任务状态，禁止进入 Git 和 `<distRoot>/`。
- `deploy/`：当前工作区实例的 Nginx、systemd 等部署配置，不进入 `<distRoot>/`。
- 模块必须包含 `config.json` 才会被识别。
- 模块 `order` 使用正数从顶部排序，使用负数从底部排序；`-1` 最靠近底部，不能使用 `0`。
- 模块 `private: true` 时隐藏工具栏入口但仍生成页面；`publish: false` 时完全不进入静态构建。
- 模块内容默认放在 `content/` 中，支持 Markdown 和 HTML。
- 模块未配置首页且根目录没有 `index.md` 时，会自动生成按时间排序、支持标题和标签搜索的分页首页；可用 `index.type: "generated"` 强制启用。
- 内容缺少 `create` 时使用 2000-01-01，`tags` 可以缺少或为空；公开模块同时生成 `/openworkspace-index/<module>.json`。
- 修改内容后运行 `npm run dev` 预览，运行 `npm run build` 生成 `<distRoot>/`；默认仍为框架根目录 `dist/`。

`src/` 属于框架实现，普通内容使用者不需要修改。
