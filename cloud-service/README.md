# BroFit 微信云托管服务

这是小程序云端调用链的 P0 服务，只提供 `GET /health`。

## 本地验证

```bash
npm install
npm run typecheck
npm test
npm start
```

服务默认监听 `8080`，可通过 `PORT` 覆盖。启动后请求 `http://localhost:8080/health`，应收到：

```json
{ "status": "ok", "timestamp": "2026-01-01T00:00:00.000Z" }
```

## 微信云托管发布

在现有云托管服务中创建版本，上传本目录作为构建根目录，选择 `Dockerfile` 构建并将监听端口设为 `8080`。发布后把环境 ID 与服务名填写到 `miniprogram/config/cloud.ts`，再在开发者工具打开登录页验证联通状态。

P0 建议只开启小程序 `callContainer` 调用，关闭公网访问。
