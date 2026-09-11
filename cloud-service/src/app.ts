import express from 'express';

export interface HealthResponse {
  status: 'ok';
  timestamp: string;
}

const app = express();

app.disable('x-powered-by');

app.get('/health', (request, response) => {
  // 微信云托管会注入身份上下文。仅记录是否存在，避免在日志中写入个人标识。
  const hasWechatContext = Boolean(request.header('x-wx-openid'));
  console.info(JSON.stringify({ event: 'health_check', hasWechatContext }));

  const payload: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString()
  };
  response.status(200).json(payload);
});

export default app;
