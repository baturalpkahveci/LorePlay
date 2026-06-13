import type { Pool } from 'pg';
import type { Game } from '../../src/interfaces/models.js';
import { pool } from '../database.js';

export interface JournalDocument {
  games: Game[];
  updatedAt: Date | null;
}

export interface JournalRepository {
  initialize(): Promise<void>;
  findByUserId(userId: string): Promise<JournalDocument>;
  saveByUserId(userId: string, games: Game[]): Promise<void>;
}

export class NeonJournalRepository implements JournalRepository {
  constructor(private readonly database: Pool) {}

  async initialize() {
    await this.database.query(`
      CREATE TABLE IF NOT EXISTS journal_documents (
        user_id TEXT PRIMARY KEY,
        data JSONB NOT NULL DEFAULT '[]'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }

  async findByUserId(userId: string): Promise<JournalDocument> {
    const result = await this.database.query<{ data: Game[]; updated_at: Date }>(
      'SELECT data, updated_at FROM journal_documents WHERE user_id = $1',
      [userId],
    );
    const document = result.rows[0];
    return {
      games: document?.data || [],
      updatedAt: document?.updated_at || null,
    };
  }

  async saveByUserId(userId: string, games: Game[]) {
    await this.database.query(
      `INSERT INTO journal_documents (user_id, data, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [userId, JSON.stringify(games)],
    );
  }
}

export const journalRepository: JournalRepository | undefined = pool
  ? new NeonJournalRepository(pool)
  : undefined;
