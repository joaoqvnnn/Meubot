CREATE TABLE IF NOT EXISTS gift_cards (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  value NUMERIC(12,2) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  used_by BIGINT,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gift_cards_used_by ON gift_cards (used_by);

CREATE TABLE IF NOT EXISTS gift_card_products (
  gift_card_id BIGINT NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (gift_card_id, product_id)
);

INSERT INTO settings (key, value) VALUES
  ('gift_code_example', 'ABC123XYZ456'),
  ('gift_code_length', '12')
ON CONFLICT (key) DO NOTHING;
