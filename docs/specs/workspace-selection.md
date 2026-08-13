# 工作区与生成目录选择

- Status: Implemented
- Updated: 2026-08-13

## 目标

- OpenWorkspace 仓库保留可独立运行的内置示例工作区。
- 用户可以把真实工作区放在任意目录或独立私有仓库中。
- 内置工作区与外部工作区采用相同结构，包括实例自己的 `deploy/` 配置。
- 构建、开发服务器、API 宿主和 postbuild 使用同一个工作区根目录。
- 静态生成目录可以独立于框架和工作区放置。

## 行为要求

1. `OPENWORKSPACE_WORKSPACE_ROOT` 环境变量具有最高优先级。
2. 未设置环境变量时，读取框架根目录的 `openworkspace.config.json`；仓库提供的默认配置指向内置 `workspace/`。
3. 配置文件通过非空字符串字段 `workspaceRoot` 指定工作区，通过非空字符串字段 `distRoot` 指定静态生成目录，并通过 `theme` 选择构建主题；相对路径都以框架根目录为基准。
4. 环境变量和配置文件都不存在时，使用框架仓库内置的 `workspace/`。
5. 未配置 `distRoot` 时默认使用框架根目录的 `./dist`，保持现有目录结构兼容。
6. 已存在但无法解析、字段未知、`workspaceRoot`、`distRoot` 或 `theme` 无效的配置必须立即报错。
7. `distRoot` 不能是框架/工作区的根目录或父目录，也不能放入源码、模块、服务、存储或部署配置目录，避免构建清理误删源数据。
8. Nginx、systemd 等实例部署配置位于 `<workspaceRoot>/deploy/`，不参与静态构建。
9. 未配置 `theme` 时默认使用 `normal`；详细主题行为见[构建主题选择](theme-selection.md)。

## 验收条件

- 无配置时生产构建继续使用内置 `workspace/`。
- 配置相对或绝对路径时，内容加载和 postbuild 读取所选工作区。
- 配置相对或绝对 `distRoot` 时，Astro 构建、预览和 postbuild 使用同一生成目录。
- 默认配置仍生成到框架根目录的 `dist/`。
- 默认配置使用 `normal`，并可选择存在于框架 `themes/` 下的其他主题。
- 环境变量能够覆盖配置文件。
- API 宿主从所选工作区发现服务。
- 框架根目录没有独立 `deploy/`；内置和外部工作区使用相同部署路径。
- 配置解析、单元测试、类型检查和生产构建通过。

## 关联模块与 ADR

- [内容与路由管线](../architecture/modules/content-pipeline.md)
- [私有服务运行时](../architecture/modules/service-runtime.md)
- [ADR-0005：可配置工作区根目录](../adr/0005-configurable-workspace-root.md)
