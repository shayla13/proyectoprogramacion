import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

export async function runMigrations(): Promise<{ applied: string[]; skipped: string[]; errors: string[] }> {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const applied: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      const { rows } = await client.query('SELECT id FROM _migrations WHERE filename = $1', [file]);
      if (rows.length > 0) {
        skipped.push(file);
        continue;
      }

      try {
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
        await client.query(sql);
        await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
        applied.push(file);
      } catch (err) {
        errors.push(`${file}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  } finally {
    await client.end();
  }

  return { applied, skipped, errors };
}

export async function diagnoseDatabase(): Promise<{
  connected: boolean;
  tables: string[];
  migrations: string[];
  error?: string;
}> {
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();

    const tablesResult = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name
    `);
    const tables = tablesResult.rows.map(r => r.table_name);

    let migrations: string[] = [];
    if (tables.includes('_migrations')) {
      const migResult = await client.query('SELECT filename FROM _migrations ORDER BY applied_at');
      migrations = migResult.rows.map(r => r.filename);
    }

    return { connected: true, tables, migrations };
  } catch (err) {
    return { connected: false, tables: [], migrations: [], error: String(err) };
  } finally {
    await client.end().catch(() => {});
  }
}
