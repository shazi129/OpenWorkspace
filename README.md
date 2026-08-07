# OpenWorkspace

OpenWorkspace 是一个由文件内容驱动的静态个人工作空间。使用者只需维护 `data/` 中的 Markdown、HTML 和资源文件，框架会生成模块导航、目录树、文章页面和静态资源路由。

核心原则：**OpenWorkspace 不拥有用户数据，工作区文件系统是唯一事实来源。**

## 快速入口

- Agent 与新贡献者：[工程快速上下文](docs/agent/CONTEXT.md)
- 按任务查找文档：[文档索引](docs/agent/INDEX.md)
- 开发和验证流程：[工作流](docs/agent/WORKFLOW.md)
- 完整技术设计：[技术方案](docs/技术方案.md)
- 安装和内容创作：[安装文档](docs/安装文档.md)
- 用户可见变化：[CHANGELOG](CHANGELOG.md)

## 常用命令

```bash
npm run context
npm run dev
npm run check
npm test
npm run build
```
