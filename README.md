# BroFit 运动打卡小程序

原生微信小程序 + TypeScript 的前端第一版。业务页面当前使用本地 Mock API；已提供微信云托管健康检查调用链，后续可在同一请求封装上接入业务接口。

## 本地运行

1. 用微信开发者工具导入项目根目录。
2. `miniprogram/` 已配置为小程序根目录，AppID 已配置为目标小程序，可直接预览 Mock 数据。
3. 如需检查 TypeScript：

```bash
npm install
npm run typecheck
npm run build:miniprogram
```

微信开发者工具运行的是编译后的同路径 `.js` 文件；修改 `.ts` 后请重新执行 `npm run build:miniprogram`。

## 主要入口

- `miniprogram/pages/home/index`：运动首页
- `miniprogram/pages/check-in/index`：运动打卡
- `miniprogram/pages/ranking/index`：排行榜
- `miniprogram/pages/messages/index`：消息与提醒
- `miniprogram/pages/profile/index`：个人中心
- `miniprogram/services/api.ts`：前端依赖的统一 API 接口
- `miniprogram/services/mock-api.ts`：当前启用的 Mock 实现
- `miniprogram/services/cloud-api.ts`：云托管适配器预留

## 微信云托管健康检查

1. 在云托管控制台为现有服务发布 `cloud-service/` 目录，使用其中的 Dockerfile 构建，监听端口设为 `8080`。
2. 在 `miniprogram/config/cloud.ts` 填写云托管服务名（环境 ID 已填入；不要填写 AppSecret 或任何密钥）。
3. 在微信开发者工具打开登录页，状态显示“云服务已连接”即表示小程序私有调用链可用；云服务异常不会影响 Mock 登录。

服务端本地检查：

```bash
cd cloud-service
npm install
npm run typecheck
npm test
```

## 接入后端

页面只依赖 `getApi()` 返回的 `FitnessApi`。后端完成后，将 `miniprogram/services/api.ts` 中的实现切换到 `createCloudApi()`；该适配器已通过 `wx.cloud.callContainer` 调用云托管，页面组件无需改动。

积分和卡路里计算目前用于前端预览；接入后端后应以服务端返回结果为准。

> AppSecret 不应出现在小程序前端、仓库或 `project.config.json` 中。接入云托管时请配置为服务端环境变量；如果该密钥是真实生产密钥且已在聊天或日志中暴露，建议立即在微信公众平台重置。
