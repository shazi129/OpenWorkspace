# ADR-0003：公共 Agent 知识与厂商适配入口分离

- Status: Accepted
- Date: 2026-08-07

## 背景

工程同时使用 Codex、CodeBuddy，并可能继续增加其他编码 Agent。每个平台识别的入口文件不同。如果在各入口中复制完整架构和规则，内容会快速漂移，Agent 得到互相冲突的工程认知。

## 决定

- `docs/agent/`、`docs/architecture/`、`docs/specs/` 和 `docs/adr/` 是厂商无关的公共知识源。
- 根目录 `AGENTS.md` 只作为 Codex 入口。
- 根目录 `CODEBUDDY.md` 只作为 CodeBuddy 入口，并导入公共文档。
- 厂商入口只包含加载顺序和极少量平台说明，不复制功能或架构正文。
- Git 是精确修改历史的事实来源；`npm run context` 负责动态汇总工作区状态和近期提交。

## 后果

正面影响：

- 新增 Agent 时只需增加一个薄适配入口。
- 人工贡献者和所有 Agent 阅读相同工程事实。
- 修改历史不会被静态复制到每次对话上下文。

代价：

- 不支持文档导入的 Agent 需要在入口中明确执行读取步骤。
- 公共文档必须随功能和架构变化同步维护。
- 需要测试入口是否仍指向存在的公共文件。

## 关联内容

- [工程快速上下文](../agent/CONTEXT.md)
- [工作流](../agent/WORKFLOW.md)
- [文档索引](../agent/INDEX.md)
