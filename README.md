# BroFit 运动打卡小程序

原生微信小程序 + TypeScript + 微信云托管的 BroFit 第一版。生产默认使用云托管 API、CloudBase 云存储和独立 `brofit` MySQL；Mock 仅用于显式本地开发。

## 本地运行

1. 用微信开发者工具导入项目根目录。
2. `miniprogram/` 已配置为小程序根目录，AppID 已配置为目标小程序。默认请求云托管服务；如需本地 Mock，在开发者工具控制台执行 `wx.setStorageSync('brofit:api-mode', 'mock')` 后重启小程序。
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
- `miniprogram/services/mock-api.ts`：显式本地开发模式的 Mock 实现
- `miniprogram/services/cloud-api.ts`：生产默认的云托管适配器，负责上传 CloudBase 文件和换取临时链接

## 微信云托管健康检查

1. 在云托管控制台为现有服务发布 `cloud-service/` 目录，使用其中的 Dockerfile 构建，监听端口设为 `8080`。
2. 在 `miniprogram/config/cloud.ts` 填写云托管服务名（环境 ID 已填入；不要填写 AppSecret 或任何密钥）。
3. 在微信开发者工具打开登录页，状态显示“云服务已连接”即表示小程序私有调用链可用。

服务端本地检查：

```bash
cd cloud-service
npm install
npm run typecheck
npm test
```

## 数据库和发布

云服务启动时会校验 `DB_HOST`、`DB_PORT`、`DB_NAME=brofit`、`DB_USER=brofit_app`、`DB_PASSWORD` 并做数据库健康检查。首次发布前，在数据库控制台手动执行 `cloud-service/migrations/001_initial.sql`；今后的表和字段变化同样由你按版本手动执行对应 SQL。运行中的 API 进程只使用最小权限 `brofit_app`，不需要 DDL 权限。请在 CDB 控制台创建业务账号，不要把 root 密码或任何数据库凭据放入仓库、镜像、日志或小程序代码。

卡路里、积分、连胜、周区间和真实排行变化均由服务端计算；小程序的计算函数只用于输入预估展示。

> AppSecret 不应出现在小程序前端、仓库或 `project.config.json` 中。接入云托管时请配置为服务端环境变量；如果该密钥是真实生产密钥且已在聊天或日志中暴露，建议立即在微信公众平台重置。
