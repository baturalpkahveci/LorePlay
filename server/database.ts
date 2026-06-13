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
