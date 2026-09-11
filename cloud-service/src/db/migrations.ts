import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { SqlPool } from './pool';

function migrationVersion(fileName: string): string {
  const match = /^(\d+)_.*\.sql$/i.exec(fileName);
  if (!match) throw new Error(`Invalid migration file name: ${fileName}`);
  return match[1];
}

export async function runMigrations(pool: SqlPool, migrationsDirectory: string): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(32) NOT NULL PRIMARY KEY,
      applied_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const files = (await readdir(migrationsDirectory))
    .filter((fileName) => /^\d+_.*\.sql$/i.test(fileName))
    .sort((a, b) => Number(migrationVersion(a)) - Number(migrationVersion(b)));
  const [rows] = await pool.query<Array<{ version: string }>>('SELECT version FROM schema_migrations');
  const applied = new Set(rows.map((row) => String(row.version)));

  for (const fileName of files) {
    const version = migrationVersion(fileName);
    if (applied.has(version)) continue;
    const sql = await readFile(path.join(migrationsDirectory, fileName), 'utf8');
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      for (const statement of sql.split(';').map((item) => item.trim()).filter(Boolean)) {
        await connection.query(statement);
      }
      await connection.query('INSERT INTO schema_migrations (version) VALUES (?)', [version]);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

export async function assertMigrationsApplied(pool: SqlPool): Promise<void> {
  const [rows] = await pool.query<Array<{ version: string }>>(
    "SELECT version FROM schema_migrations WHERE version = '001' LIMIT 1"
  );
  if (!rows[0]) throw new Error('database migrations are not applied');
}
