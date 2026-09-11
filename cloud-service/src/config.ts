export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  connectionLimit: number;
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
