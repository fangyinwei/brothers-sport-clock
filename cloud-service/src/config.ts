export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  connectionLimit: number;
}

export interface WechatSubscribeConfig {
  appId: string;
  appSecret: string;
  templateId: string;
  page: string;
  data: Record<string, string>;
}

function required(name: string, value: string | undefined): string {
  const normalized = value?.trim();
  if (!normalized) throw new Error(`${name} is required`);
  return normalized;
}

function integer(name: string, value: string | undefined, fallback: number): number {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`${name} must be a positive integer`);
  return parsed;
}

export function readDatabaseConfig(env: NodeJS.ProcessEnv = process.env, options: { allowAnyUser?: boolean } = {}): DatabaseConfig {
  const database = required('DB_NAME', env.DB_NAME);
  if (database !== 'brofit') throw new Error('DB_NAME must be brofit');

  const user = required('DB_USER', env.DB_USER);
  if (!options.allowAnyUser && user !== 'brofit_app') throw new Error('DB_USER must be brofit_app');

  return {
    host: required('DB_HOST', env.DB_HOST),
    port: integer('DB_PORT', env.DB_PORT, 3306),
    database,
    user,
    password: required('DB_PASSWORD', env.DB_PASSWORD),
    connectionLimit: integer('DB_CONNECTION_LIMIT', env.DB_CONNECTION_LIMIT, 10)
  };
}

/**
 * Subscribe messaging is optional. All four credentials must be supplied to
 * enable it; keeping them absent leaves the service in in-app-message-only mode.
 */
export function readWechatSubscribeConfig(env: NodeJS.ProcessEnv = process.env): WechatSubscribeConfig | undefined {
  const values = [env.WECHAT_APP_ID, env.WECHAT_APP_SECRET, env.WECHAT_SUBSCRIBE_TEMPLATE_ID, env.WECHAT_SUBSCRIBE_TEMPLATE_DATA];
  if (values.every((value) => !value?.trim())) return undefined;

  const rawData = required('WECHAT_SUBSCRIBE_TEMPLATE_DATA', env.WECHAT_SUBSCRIBE_TEMPLATE_DATA);
  let data: unknown;
  try {
    data = JSON.parse(rawData);
  } catch (_error) {
    throw new Error('WECHAT_SUBSCRIBE_TEMPLATE_DATA must be valid JSON');
  }
  if (!data || typeof data !== 'object' || Array.isArray(data) || !Object.values(data).every((value) => typeof value === 'string')) {
    throw new Error('WECHAT_SUBSCRIBE_TEMPLATE_DATA must be a JSON object of string values');
  }
  return {
    appId: required('WECHAT_APP_ID', env.WECHAT_APP_ID),
    appSecret: required('WECHAT_APP_SECRET', env.WECHAT_APP_SECRET),
    templateId: required('WECHAT_SUBSCRIBE_TEMPLATE_ID', env.WECHAT_SUBSCRIBE_TEMPLATE_ID),
    page: env.WECHAT_SUBSCRIBE_PAGE?.trim() || 'pages/messages/index',
    data: data as Record<string, string>
  };
}
