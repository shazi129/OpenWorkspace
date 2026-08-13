# ADR-0005：可配置工作区与生成目录

- Status: Accepted
- Date: 2026-08-13

## 背景

OpenWorkspace 需要保持当前可直接克隆、构建和演示的仓库结构，同时允许用户正文、私有服务、存储和静态生成物与框架独立管理。若把整个框架移动到新的子目录，会增加构建和部署层级；若固定读取仓库内的 `workspace/` 并输出到框架内的 `dist/`，又无法真正分离用户数据和发布产物。

## 决定

- 保留 OpenWorkspace 当前框架目录结构。
- 仓库内的 `workspace/` 作为可运行示例和未配置时的默认工作区。
- 模块、内容、服务、存储目录和实例部署配置都位于工作区；框架根目录不再维护另一套 `deploy/` 结构。
- 根目录使用单一的 `openworkspace.config.json` 配置 `workspaceRoot` 和 `distRoot`。
- `workspaceRoot` 默认指向内置 `workspace/`；`distRoot` 默认指向框架根目录的 `./dist`，保持现有行为，也可改为任意安全的外部目录。
- `OPENWORKSPACE_WORKSPACE_ROOT` 继续作为部署覆盖入口，优先级高于配置文件。
- 相对工作区路径统一以框架仓库根目录为基准。
- 构建、内容集合、API 宿主和 postbuild 共享同一根配置；Astro 构建、预览和 postbuild 共享同一个 `distRoot`。

## 后果

正面影响：

- 框架仓库可以独立运行和持续集成。
- 私有工作区可以独立建库，不需要改变框架源码布局。
- 静态生成物可以独立部署或放入工作区仓库旁的专用目录。
- 内置工作区和外部私有工作区具有相同的 `deploy/` 目录结构。
- 没有配置的现有使用方式保持兼容。

代价：

- 部署系统需要明确管理框架根目录和工作区根目录。
- 内置示例必须持续维护，并确保不包含私有数据。
- 外部工作区与框架有各自独立的版本和更新周期。
- 部署配置中的 Web 根目录必须与 `distRoot` 的实际位置保持一致。

## 关联内容

- [工作区与生成目录选择 spec](../specs/workspace-selection.md)
- [内容与路由管线](../architecture/modules/content-pipeline.md)
