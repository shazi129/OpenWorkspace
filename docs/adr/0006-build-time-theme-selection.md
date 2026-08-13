# ADR-0006：构建期主题与结构样式分离

- Status: Accepted
- Date: 2026-08-13

## 背景

页面布局、交互状态和颜色原本集中在 `src/styles/global.css`。继续在同一文件增加深色或其他主题会让组件结构与视觉方案耦合，也会迫使每个主题复制整套布局规则。

## 决定

- 框架根目录新增 `themes/`，每个主题以 `<name>/theme.css` 提供完整语义变量。
- `src/styles/global.css` 保留共享的布局、组件和响应式规则，只消费主题变量。
- 根目录 `openworkspace.config.json` 使用 `theme` 选择主题，默认是 `normal`。
- Astro 配置解析并验证主题路径，通过 Vite 别名把选中的主题作为全局 CSS 打包。
- 主题是构建期选择，不引入客户端主题状态、闪烁处理或多份主题下载。

## 后果

正面影响：

- 新主题无需复制或修改组件布局代码。
- 生产产物只包含当前主题，体积和加载路径稳定。
- 配置错误在开发或构建开始时暴露。
- `normal` 可以继续作为向后兼容的默认外观。

代价：

- 切换主题需要重启开发服务或重新构建。
- 自定义主题必须维护完整变量契约。
- 当前不支持浏览器内即时切换或跟随 `prefers-color-scheme`。

## 关联内容

- [构建主题选择 spec](../specs/theme-selection.md)
- [工作区 UI](../architecture/modules/workspace-ui.md)
- [ADR-0005：可配置工作区与生成目录](0005-configurable-workspace-root.md)
