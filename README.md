# OpenWorkspace

OpenWorkspace 是一个由私有工作空间驱动的个人网站框架。仓库内的 `workspace/` 是可运行示例；使用者也可以选择外部工作区，在其中维护模块、页面、内容和服务。框架生成静态站点，并通过可选 API 宿主运行服务端模块。

核心原则：**OpenWorkspace 不拥有用户数据，工作区文件系统是唯一事实来源。**

## 快速入口

- Agent 与新贡献者：[工程快速上下文](docs/agent/CONTEXT.md)
- 按任务查找文档：[文档索引](docs/agent/INDEX.md)
- 开发和验证流程：[工作流](docs/agent/WORKFLOW.md)
- 完整技术设计：[技术方案](docs/技术方案.md)
- 安装和内容创作：[安装文档](docs/安装文档.md)
- Nginx 与 systemd 配置：[工作区部署配置](workspace/deploy/)
- 用户可见变化：[CHANGELOG](CHANGELOG.md)

## 选择工作区、生成目录与主题

根目录的 `openworkspace.config.json` 指定当前工作区、静态生成目录和构建主题：

```json
{
  "workspaceRoot": "./workspace",
  "distRoot": "./dist",
  "theme": "normal"
}
```

两个相对路径都以 OpenWorkspace 仓库根目录为基准，也可以填写绝对路径。默认仍使用内置 `workspace/`、根目录 `dist/` 和浅色 `normal` 主题；配置文件指定的 `workspaceRoot` 不存在或不是目录时，也会从 OpenWorkspace 根目录回退到内置 `workspace/`。`theme` 改为 `dark` 可使用深褐色背景主题。主题文件位于 [`themes/`](themes/)。若要让生成物与框架分离，可将 `distRoot` 改为 `../MyWorkspace/dist` 等外部路径；部署环境可使用优先级更高的 `OPENWORKSPACE_WORKSPACE_ROOT` 临时覆盖工作区。

模块未配置首页且根目录没有 `index.md` 时，会自动生成按创建时间排序的分页首页，并支持按标题和标签搜索。内容缺少 `create` 时使用 2000-01-01，`tags` 可以留空；详细配置见[安装文档](docs/安装文档.md)。

## 常用命令

```bash
npm run context
npm run dev
npm run check
npm test
npm run build
npm run api
```
