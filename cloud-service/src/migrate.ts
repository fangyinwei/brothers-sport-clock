import path from 'node:path';
import { readDatabaseConfig } from './config';
import { runMigrations } from './db/migrations';
import { createPool } from './db/pool';

async function main(): Promise<void> {
  const migrationEnv = {
    ...process.env,
    DB_USER: process.env.DB_MIGRATION_USER || process.env.DB_USER,
    DB_PASSWORD: process.env.DB_MIGRATION_PASSWORD || process.env.DB_PASSWORD
  };
  const config = readDatabaseConfig(migrationEnv, { allowAnyUser: true });
  const pool = createPool(config);
  try {
    await runMigrations(pool, process.env.MIGRATIONS_DIR || path.resolve(process.cwd(), 'migrations'));
    console.info(JSON.stringify({ event: 'migrations_applied', database: config.database }));
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ event: 'migration_failed', error: error instanceof Error ? error.message : 'unknown' }));
  process.exitCode = 1;
});
