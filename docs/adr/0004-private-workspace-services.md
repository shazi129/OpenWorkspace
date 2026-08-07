# ADR-0004：私有工作空间与服务扩展

- Status: Accepted
- Date: 2026-08-07

## 背景

框架需要公开复用，而用户页面、股票数据和业务 API 需要保持私有。原 `data/` 只表达静态内容，无法准确容纳客户端应用、服务入口和运行时存储。Nginx仍应高效发布静态站点，但数据库 API 和重新生成命令需要常驻后台。

## 决定

- 将私有根目录命名为 `workspace/`，模块统一位于 `workspace/modules/`。
- 模块通过 `runtime: static | client | server` 表达运行方式；服务端模块声明 `serverEntry`。
- 模块专属 API 与页面共置，全局运维服务放在 `workspace/services/`。
- `src/server/` 只实现可公开复用的服务发现和 HTTP 宿主。
- `workspace/storage/` 保存运行时可变数据并禁止进入 Git 和 `dist/`。
- Nginx发布 `dist/`，通过 HTTP 反向代理连接仅监听回环地址的 Node 服务，而不采用 CGI 目录执行模型。

## 后果

正面影响：

- 私有页面、配置和业务服务保持内聚，未来可整体拆为私有仓库。
- 框架不包含用户业务代码，新增 API 不需要修改通用路由宿主。
- 静态资源与服务/数据库具有明确发布边界。

代价：

- `server` 模块不能仅凭 `dist/` 运行，需要进程管理器启动 API 宿主。
- 更新服务代码后需要由 systemd、容器或其他进程管理器重启宿主。
- 私有服务属于可信可执行代码，不能直接加载不可信工作空间。

## 关联内容

- [私有服务运行时](../architecture/modules/service-runtime.md)
- [设置模块与更新](../specs/rebuild-settings.md)
- [ADR-0001](0001-filesystem-content-source.md)
- [ADR-0002](0002-build-manifest-and-generic-routes.md)
