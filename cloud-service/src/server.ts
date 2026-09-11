import { readDatabaseConfig, readWechatSubscribeConfig } from './config';
import { createPool, ping } from './db/pool';
import { createApp } from './app';
import { BrofitService } from './service';
import { WechatSubscribeNotifier } from './wechat-subscribe';

function resolvePort(value: string | undefined): number {
  const port = Number(value ?? '8080');
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT must be an integer between 1 and 65535; received ${value}`);
  }
  return port;
}

async function main(): Promise<void> {
  const port = resolvePort(process.env.PORT);
  const config = readDatabaseConfig();
  const subscribeConfig = readWechatSubscribeConfig();
  const pool = createPool(config);
  await ping(pool);
  const notifier = subscribeConfig ? new WechatSubscribeNotifier(subscribeConfig) : undefined;
  const app = createApp({ service: new BrofitService(pool, () => new Date(), notifier, subscribeConfig?.templateId), ping: () => ping(pool) });
  const server = app.listen(port, '0.0.0.0', () => {
    console.info(JSON.stringify({ event: 'service_started', port }));
  });
  const close = async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await pool.end();
  };
  process.once('SIGTERM', close);
  process.once('SIGINT', close);
}

main().catch((error) => {
  console.error(JSON.stringify({ event: 'service_start_failed', error: error instanceof Error ? error.message : 'unknown' }));
  process.exitCode = 1;
});
