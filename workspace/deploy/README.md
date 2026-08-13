# 工作区部署配置

- `nginx/openworkspace.conf`：发布框架生成的 `<distRoot>/`，并把 `/api/` 反向代理到本地 API 宿主。
- `systemd/openworkspace-api.service`：以专用用户常驻运行框架的 `npm run api`。

部署前应根据当前实例调整域名、Nginx `root`（必须对应 `openworkspace.config.json` 解析后的 `distRoot`）、OpenWorkspace 框架路径、服务用户和 Node/npm 的绝对路径。服务密钥应放在 `/etc/openworkspace/api.env` 等仓库外受限文件中，不要写入部署配置或提交到 Git。

外部工作区可以保持相同的 `deploy/` 目录结构，让内容、服务和实例部署配置由同一个私有工作区仓库管理。
