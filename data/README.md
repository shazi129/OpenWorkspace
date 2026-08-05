# data 目录

这是 OpenWorkspace 使用者主要维护的目录。

- `config.json`：网站级配置。
- 每个一级子目录代表一个功能模块。
- 模块必须包含 `config.json` 才会被识别。
- 模块内容默认放在 `content/` 中，支持 Markdown 和 HTML。
- 修改内容后运行 `npm run dev` 预览，运行 `npm run build` 生成 `dist/`。

`src/` 属于框架实现，普通内容使用者不需要修改。

