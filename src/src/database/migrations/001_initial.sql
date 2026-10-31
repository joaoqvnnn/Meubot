CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  whatsapp TEXT,
  email TEXT,
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  is_channel_verified BOOLEAN NOT NULL DEFAULT FALSE,
  referred_by BIGINT,
  affiliate_active BOOLEAN NOT NULL DEFAULT FALSE,
  affiliate_code TEXT UNIQUE,
  last_bot_message_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users (telegram_id);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS message_templates (
  key TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  media_url TEXT,
  buttons_json JSONB DEFAULT '[]'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_states (
  telegram_id BIGINT PRIMARY KEY,
  state TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
