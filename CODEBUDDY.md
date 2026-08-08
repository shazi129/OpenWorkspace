# CodeBuddy Project Memory

以下文件是本工程的公共事实来源：

@docs/agent/CONTEXT.md
@docs/agent/WORKFLOW.md
@docs/agent/INDEX.md

处理具体任务时，按照 `INDEX.md` 加载相关模块文档、spec 和 ADR。需要了解当前分支、工作区状态和近期修改历史时运行 `npm run context`。

不要在 CodeBuddy 专属规则中复制公共架构和功能说明；公共知识只在 `docs/` 中维护。

## 每次任务结束前

1. 按 `docs/agent/WORKFLOW.md` 的文档同步矩阵检查是否需要更新文档。
2. 凡涉及用户可见的功能变化（新增功能、行为变更、Bug 修复），**必须**在 `CHANGELOG.md` 的 `## Unreleased` 节下追加条目。
3. 汇报时列出本次写入 CHANGELOG 的内容。
