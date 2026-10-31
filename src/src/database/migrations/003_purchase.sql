CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  mp_payment_id TEXT UNIQUE,
  amount NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  kind TEXT NOT NULL,
  purchase_id BIGINT,
  qr_code TEXT,
  qr_code_base64 TEXT,
  ticket_url TEXT,
  expires_at TIMESTAMPTZ,
  raw JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id, status);

CREATE TABLE IF NOT EXISTS stock_items (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  extra_note TEXT,
  status TEXT NOT NULL DEFAULT 'available',
  reserved_by BIGINT,
  reserved_until TIMESTAMPTZ,
  purchase_id BIGINT,
  sold_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stock_available ON stock_items(product_id, status);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  balance_before NUMERIC(12,2) NOT NULL,
  balance_after NUMERIC(12,2) NOT NULL,
  kind TEXT NOT NULL,
  source TEXT NOT NULL,
  related_id BIGINT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_items (
  id BIGSERIAL PRIMARY KEY,
  purchase_id BIGINT NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  stock_item_id BIGINT NOT NULL REFERENCES stock_items(id),
  item_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE purchases ADD COLUMN IF NOT EXISTS order_short_id TEXT;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS balance_used NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS pix_used NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS payment_id BIGINT REFERENCES payments(id);
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS pix_chat_id BIGINT;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS pix_message_id BIGINT;

INSERT INTO settings (key, value) VALUES
  ('pix_expire_minutes', '30'),
  ('pix_reserve_minutes', '20')
ON CONFLICT (key) DO NOTHING;
