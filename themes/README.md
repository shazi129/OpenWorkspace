# OpenWorkspace 主题

每个主题使用独立目录，并提供一个 `theme.css`：

```text
themes/
├─ normal/theme.css
└─ dark/theme.css
```

根目录 `openworkspace.config.json` 的 `theme` 字段选择目录名；省略时使用 `normal`。主题负责颜色、表面、边框、阴影等视觉变量，页面结构和响应式规则仍由 `src/styles/global.css` 维护。

新增主题时复制现有主题目录并覆盖全部变量，主题名只能包含小写字母、数字和连字符。配置指向不存在的目录或缺少 `theme.css` 时，开发和构建命令会立即失败。
