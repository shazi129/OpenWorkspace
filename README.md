# OpenWorkspace

OpenWorkspace 是一个由私有工作空间驱动的个人网站框架。使用者在 `workspace/` 中维护模块、页面、内容和服务，框架生成静态站点，并通过可选 API 宿主运行服务端模块。

核心原则：**OpenWorkspace 不拥有用户数据，工作区文件系统是唯一事实来源。**

## 快速入口

- Agent 与新贡献者：[工程快速上下文](docs/agent/CONTEXT.md)
- 按任务查找文档：[文档索引](docs/agent/INDEX.md)
- 开发和验证流程：[工作流](docs/agent/WORKFLOW.md)
- 完整技术设计：[技术方案](docs/技术方案.md)
- 安装和内容创作：[安装文档](docs/安装文档.md)
- Nginx 与 systemd 示例：[部署配置](deploy/)
- 用户可见变化：[CHANGELOG](CHANGELOG.md)

## 常用命令

```bash
npm run context
npm run dev
npm run check
npm test
npm run build
npm run api
```
