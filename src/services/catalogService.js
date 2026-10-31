const { query } = require('../database/connection');

async function getPageSize() {
  const r = await query(`SELECT value FROM settings WHERE key = 'catalog_page_size'`);
  const n = parseInt(r.rows[0]?.value || '10', 10);
  return Number.isFinite(n) && n > 0 ? n : 10;
}

async function countActive() {
  const r = await query(
    `SELECT COUNT(*)::int AS n FROM products WHERE active = TRUE AND visible = TRUE`
  );
  return r.rows[0].n;
}

async function listActive(limit, offset) {
  const r = await query(
    `SELECT id, name, price, stock, warranty_days, description, site_url, note, image_url
       FROM products
      WHERE active = TRUE AND visible = TRUE
      ORDER BY sort_order ASC, id ASC
      LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return r.rows;
}

async function getById(id) {
  const r = await query(
    `SELECT id, name, price, stock, warranty_days, description, site_url, note, image_url, active, visible
       FROM products WHERE id = $1`,
    [id]
  );
  return r.rows[0] || null;
}

async function getSalesCount(productId) {
  const r = await query(
    `SELECT COALESCE(SUM(quantity), 0)::int AS n
       FROM purchases
      WHERE product_id = $1 AND status IN ('approved','completed','paid')`,
    [productId]
  );
  return r.rows[0].n;
}

async function trackView(userId, productId) {
  await query(
    `INSERT INTO product_views (user_id, product_id, last_seen)
     VALUES ($1, $2, NOW())
     ON CONFLICT (user_id, product_id)
     DO UPDATE SET last_seen = NOW()`,
    [userId, productId]
  );
}

async function countOnline(productId) {
  const r = await query(
    `SELECT COUNT(*)::int AS n
       FROM product_views
      WHERE product_id = $1 AND last_seen > NOW() - INTERVAL '5 minutes'`,
    [productId]
  );
  return r.rows[0].n;
}

module.exports = {
  getPageSize,
  countActive,
  listActive,
  getById,
  getSalesCount,
  trackView,
  countOnline,
};
