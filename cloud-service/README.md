# BroFit 微信云托管服务

这是 BroFit 的微信云托管 API 服务。业务数据只写入独立的 `brofit` MySQL 数据库，微信云托管通过 `x-wx-openid` 身份上下文识别当前用户。

## 本地验证

```bash
npm install
npm run typecheck
npm test
# 配置 DB_* 后，先完成一次迁移，再启动服务
npm run migrate
npm start
```

启动前需要配置以下运行时环境变量；服务会校验最小权限账号和数据库名称，并只做数据库健康检查。数据库结构由部署人员在控制台手动执行 `migrations/` 下对应的 SQL 文件；运行中的 API 进程不需要 DDL 权限：

```bash
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=brofit
DB_USER=brofit_app
DB_PASSWORD=仅放在云托管环境变量中的密码
```

首次发布前，在数据库控制台手动执行 `migrations/001_initial.sql`。后续表或字段变化时，按版本顺序手动执行新的 SQL 文件。云托管长期运行环境只配置 `DB_USER=brofit_app`，不要把 root 或迁移账号放入服务环境变量。

服务默认监听 `8080`，可通过 `PORT` 覆盖。启动后请求 `http://localhost:8080/health`，应收到：

```json
{ "status": "ok", "timestamp": "2026-01-01T00:00:00.000Z" }
```

## 微信云托管发布

在现有云托管服务 `express-9l6u` 中创建版本，上传本目录作为构建根目录，选择 `Dockerfile` 构建并将监听端口设为 `8080`。云托管与 CDB 使用同地域、同 VPC 私网访问；在控制台预先创建 `brofit` 库和仅访问该库业务表的 `brofit_app` 账号。不要把 root 密码写入 Git、镜像、日志或小程序代码。

云存储建议配置为仅认证的小程序用户可访问。小程序上传到 `users/<内部用户 UUID>/...`，接口只接受当前用户目录下的 `cloud://` fileID；渲染前由 `getTempFileURL` 换成临时 HTTPS 地址。

P0 建议只开启小程序 `callContainer` 调用，关闭公网访问。
