# Agent 与贡献者工作流

本文件是厂商无关的工作约定，Codex、CodeBuddy 和人工贡献者共享。

## 开始工作

1. 阅读 `CONTEXT.md`，确认工程边界和关键入口。
2. 运行 `git status --short`，保留已有未提交修改。
3. 在 `INDEX.md` 中找到任务对应的模块文档、spec 和 ADR。
4. 需要了解近期变化时运行 `npm run context`；需要追溯单个文件时使用 `git log --follow -- <path>` 和 `git blame <path>`。
5. 先确认行为和测试边界，再修改代码。

## 修改原则

- 内容创作和私有模块任务通常只修改当前选中的 `<workspaceRoot>/`。
- 通用服务宿主修改 `src/server/`；模块业务 API 放在对应模块的 `serverEntry` 或 `<workspaceRoot>/services/`。
- 框架功能任务修改 `src/` 并补充或更新 `tests/`。
- 不直接编辑 `<distRoot>/`、`.astro/` 或 `node_modules/`。
- 不用生成代码替代通用动态路由。
- 不绕过 `resolveInside` 等路径边界检查。
- 不把 `authenticated` 或 `allowlist` 内容放入公开静态产物。
- 不改变既有 URL 规则，除非 spec 明确要求并提供迁移方案。
- 不清理或覆盖与当前任务无关的用户修改。

## 验证矩阵

| 修改类型 | 最低验证 |
| --- | --- |
| 纯文档 | 检查内部链接；运行 `npm run context` |
| 配置 schema、加载器、Markdown 插件 | `npm test`、`npm run check`、`npm run build` |
| Astro 组件、布局或 CSS | `npm run check`、`npm test`、`npm run build`；检查相关构建 HTML |
| `<workspaceRoot>/` 内容或模块配置 | `npm run check`、`npm run build` |
| API 宿主或私有服务 | `npm test`、`npm run check`、`npm run build`；启动 `npm run api` 检查健康接口 |
| 依赖或构建配置 | `npm test`、`npm run check`、`npm run build` |

项目要求 Node.js `>= 22.22.2`。如果当前终端版本较低，应切换到 `.nvmrc` 指定版本，不能把工具启动失败误判为代码错误。

## 文档同步矩阵

| 变化 | 同步位置 |
| --- | --- |
| 工程目标、关键入口、稳定约束变化 | `docs/agent/CONTEXT.md` |
| 模块边界、依赖或数据流变化 | `docs/architecture/` |
| 功能行为或验收条件变化 | `docs/specs/` |
| 重要技术选择及其取舍 | 新增 `docs/adr/NNNN-*.md` |
| 用户可见功能变化 | `CHANGELOG.md` |
| 仅实现细节变化且不影响以上内容 | 通常无需更新架构文档 |

## Spec 生命周期

- `Proposed`：需求正在讨论，不能当作当前行为。
- `Accepted`：需求已确认，尚未全部完成。
- `Implemented`：验收条件已由代码和验证覆盖。
- `Superseded`：已被新 spec 替代，保留用于追溯。

Spec 描述“期望行为和验收条件”；模块文档描述“当前实现结构”；不要在两者之间复制大段实现细节。

## ADR 生命周期

ADR 只记录重要且难以从代码直接看出的决定。已接受的 ADR 不应重写结论；决策改变时新增 ADR，并把旧 ADR 标为 `Superseded`。

每个 ADR 至少包含：

- 状态与日期。
- 背景问题。
- 最终决定。
- 正面和负面后果。
- 被替代或关联的 ADR/spec。

## 历史和提交

Git 是精确修改历史的事实来源：

```bash
npm run context
git log --oneline --decorate -20
git log --follow -- src/core/content-loader.ts
git show <commit>
git blame src/core/content-loader.ts
```

`CHANGELOG.md` 只总结用户可见变化，ADR 只记录设计原因；两者都不能替代 Git。

除非用户明确要求，Agent 不创建提交、不推送远端、不发布产物。需要提交时，提交信息应概括一个逻辑变化，避免使用无信息量的 `update`。

## 完成任务

1. 执行与风险匹配的验证。
2. 运行 `git diff --check`。
3. 确认没有意外修改生成产物或用户文件。
4. 按同步矩阵更新文档。
5. 汇报完成内容、验证结果和仍存在的限制。
