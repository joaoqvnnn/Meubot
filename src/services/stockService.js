async function reserveOne(client, productId, userId, minutes) {
  const r = await client.query(
    `SELECT id FROM stock_items
       WHERE product_id = $1 AND status = 'available'
       ORDER BY id ASC
       LIMIT 1
       FOR UPDATE SKIP LOCKED`,
    [productId]
  );
  if (!r.rows[0]) return null;
  const id = r.rows[0].id;
  await client.query(
    `UPDATE stock_items
        SET status = 'reserved',
            reserved_by = $1,
            reserved_until = NOW() + ($2 || ' minutes')::interval
      WHERE id = $3`,
    [userId, String(minutes), id]
  );
  return id;
}

async function markSold(client, stockItemId, purchaseId) {
  await client.query(
    `UPDATE stock_items
        SET status = 'sold',
            purchase_id = $1,
            sold_at = NOW(),
            reserved_by = NULL,
            reserved_until = NULL
      WHERE id = $2`,
    [purchaseId, stockItemId]
  );
}

async function releaseExpired() {
  const { query } = require('../database/connection');
  await query(
    `UPDATE stock_items
        SET status = 'available',
            reserved_by = NULL,
            reserved_until = NULL
      WHERE status = 'reserved' AND reserved_until < NOW()`
  );
}

async function availableCount(productId) {
  const { query } = require('../database/connection');
  const r = await query(
    `SELECT COUNT(*)::int AS n FROM stock_items
      WHERE product_id = $1 AND status = 'available'`,
    [productId]
  );
  return r.rows[0].n;
}

module.exports = { reserveOne, markSold, releaseExpired, availableCount };
