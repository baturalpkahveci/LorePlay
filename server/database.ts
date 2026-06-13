import { Pool } from 'pg';
import { hasDatabaseConfig, serverConfig } from './config.js';

export const pool = hasDatabaseConfig
  ? new Pool({
      connectionString: serverConfig.databaseUrl,
      ssl: { rejectUnauthorized: true },
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    })
  : undefined;

export const ensureJournalSchema = async () => {
  if (!pool) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS journal_documents (
      user_id TEXT PRIMARY KEY,
      data JSONB NOT NULL DEFAULT '[]'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
};
