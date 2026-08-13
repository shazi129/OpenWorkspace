# 构建主题选择

- Status: Implemented
- Updated: 2026-08-13

## 目标

- 页面结构与主题视觉配置分离。
- 根配置可以选择框架内置或用户新增的主题。
- 默认主题保持原有页面外观，并提供深褐色背景的深色主题。

## 行为要求

1. 主题位于框架根目录的 `themes/<name>/theme.css`。
2. `openworkspace.config.json` 使用 `theme` 选择主题目录名，缺省时使用 `normal`。
3. 主题名只能包含小写字母、数字和连字符。
4. 配置的主题目录不存在或缺少 `theme.css` 时，开发、检查和构建命令必须立即失败。
5. `normal` 完整保留当前浅色主题；`dark` 使用深褐背景、暖色文字和琥珀色强调色。
6. `src/styles/global.css` 只维护布局、组件状态和响应式规则；主题文件提供颜色、表面、边框、阴影和图标滤镜变量。
7. Astro 启动时解析主题并通过 Vite 别名只打包选中的 `theme.css`；修改 `theme` 后必须重新启动开发服务或重新构建。
8. 主题选择是构建配置，不在浏览器中自动跟随系统主题，也不提供运行时切换按钮。

## 验收条件

- 省略 `theme` 时构建产物使用 `normal` 的浅色变量。
- 配置 `"theme": "dark"` 时构建产物使用深褐色变量，不包含 `normal` 的页面背景变量。
- 两个内置主题都通过 Astro 检查和生产构建。
- 非法主题名、不存在的主题和缺少 `theme.css` 均有配置测试覆盖。
- 新增主题只需创建主题目录并实现完整变量集合，不需要修改组件代码。

## 关联模块与 ADR

- [工作区 UI](../architecture/modules/workspace-ui.md)
- [工作区与生成目录选择](workspace-selection.md)
- [ADR-0006：构建期主题与结构样式分离](../adr/0006-build-time-theme-selection.md)
