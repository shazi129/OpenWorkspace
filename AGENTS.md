# Codex Project Instructions

本文件只负责把 Codex 引导到厂商无关的工程知识，不在这里复制架构或功能说明。

## 开始任务前

必须读取：

1. `docs/agent/CONTEXT.md`
2. `docs/agent/WORKFLOW.md`
3. `docs/agent/INDEX.md`

然后根据任务读取 INDEX 中指向的模块文档、spec 和 ADR。需要了解当前分支、未提交修改和近期历史时，运行 `npm run context`。

## 核心约束

- `data/` 是用户内容的唯一事实来源，不把 Markdown 正文迁入数据库或框架源码。
- `src/` 是框架实现；`dist/` 和 `.astro/` 是生成产物，不直接编辑。
- 保持内容 URL 稳定；修改路径映射、目录折叠或资源路由前先阅读相关 spec。
- 当前静态版本只发布 `public` 模块，不能让非公开内容进入 `dist/`。
- 保留用户已有的未提交修改，不覆盖无关文件。

## 验证与文档同步

- 代码修改按 `docs/agent/WORKFLOW.md` 的验证矩阵执行。
- 功能行为改变时更新对应 spec。
- 模块边界或数据流改变时更新架构文档。
- 重要且难以从代码看出的设计决策新增 ADR。
- 用户可见变化更新 `CHANGELOG.md`。

除非用户明确要求，不要创建提交、推送远端或发布构建产物。
