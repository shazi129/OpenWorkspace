# 部署示例

- `nginx/openworkspace.conf.example`：发布 `dist/`，并把 `/api/` 和管理接口反向代理到本地 API 宿主。
- `systemd/openworkspace-api.service.example`：以专用用户常驻运行 `npm run api`。

复制前请调整域名、工程路径、服务用户和 Node/npm 的绝对路径。重新生成令牌放在 `/etc/openworkspace/api.env` 等仓库外受限文件中，不要写入示例或提交到 Git。

完整步骤和安全说明见 [`docs/安装文档.md`](../docs/安装文档.md#9-使用-nginx-部署)。
