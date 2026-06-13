CREATE TABLE IF NOT EXISTS journal_documents (
  user_id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS journal_documents_updated_at_idx
  ON journal_documents (updated_at DESC);
