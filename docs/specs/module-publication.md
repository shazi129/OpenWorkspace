# 模块导航可见性与静态发布

- Status: Implemented
- Updated: 2026-08-07

## 目标

- 模块可以隐藏工具栏入口，但继续生成静态页面供直接 URL 访问。
- 模块可以显式关闭发布，不生成到 `<distRoot>/`。
- 导航可见性与静态发布相互独立，避免用隐藏入口冒充访问控制。

## 行为要求

1. `private` 默认为 `false`；设为 `true` 时，模块不出现在桌面或移动端工具栏，但页面和静态资源仍正常生成。
2. `publish` 默认为 `true`；设为 `false` 时，模块不生成页面、导航或静态资源路由。
3. `private: true` 不提供认证或保密能力，知道 URL 的任何访问者仍可打开模块。
4. `access: "authenticated"` 和 `access: "allowlist"` 在认证运行时完成前仍不进入静态构建，不受 `publish: true` 影响。
5. `defaultModule` 必须指向一个实际进入静态发布的模块。

## 验收条件

- `private: true, publish: true` 的模块首页 URL 会生成，但模块导航中没有对应链接。
- `publish: false` 的模块不会出现在构建路由和资源路由中。
- 未配置两个字段的旧模块保持原有公开展示和静态发布行为。

实现结构见[内容与路由管线](../architecture/modules/content-pipeline.md)和[工作区 UI](../architecture/modules/workspace-ui.md)。
