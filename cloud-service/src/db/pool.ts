import mysql, { Pool, PoolConnection, ResultSetHeader } from 'mysql2/promise';
import { DatabaseConfig } from '../config';

export interface SqlExecutor {
  query<T = unknown>(sql: string, values?: unknown[]): Promise<[T, unknown]>;
}

export interface SqlConnection extends SqlExecutor {
  beginTransaction(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  release(): void;
}

export interface SqlPool extends SqlExecutor {
  getConnection(): Promise<SqlConnection>;
  end(): Promise<void>;
}

export function createPool(config: DatabaseConfig): SqlPool {
  return mysql.createPool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    connectionLimit: config.connectionLimit,
    waitForConnections: true,
    charset: 'utf8mb4',
    timezone: 'Z',
    dateStrings: true
  }) as unknown as SqlPool;
}

export async function ping(pool: SqlExecutor): Promise<void> {
  await pool.query('SELECT 1 AS ok');
}

export function affectedRows(result: unknown): number {
  return Number((result as ResultSetHeader | undefined)?.affectedRows ?? 0);
}

export type { Pool, PoolConnection };
