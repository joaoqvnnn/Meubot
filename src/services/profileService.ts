const { query } = require('../database/connection');

async function getStats(userId) {
  const purchases = await query(
    `SELECT COUNT(*)::int AS n, COALESCE(SUM(total), 0)::numeric AS total
       FROM purchases
      WHERE user_id = $1 AND status IN ('approved','completed')`,
    [userId]
  );
  const pix = await query(
    `SELECT COALESCE(SUM(amount), 0)::numeric AS total
       FROM wallet_transactions
      WHERE user_id = $1 AND kind = 'credit' AND source = 'recharge_pix'`,
    [userId]
  );
  const gifts = await query(
    `SELECT COUNT(*)::int AS n FROM gift_cards WHERE used_by = $1`,
    [userId]
  );
  return {
    qtd_compras: purchases.rows[0].n,
    total_gasto: purchases.rows[0].total,
    pix_inserido: pix.rows[0].total,
    gifts: gifts.rows[0].n,
  };
}

async function listPurchases(userId, page, pageSize, onlyActive) {
  const offset = page * pageSize;
  const whereStatus = `status IN ('approved','completed')`;
  const whereActive = onlyActive ? `AND expires_at > NOW()` : '';

  const total = await query(
    `SELECT COUNT(*)::int AS n FROM purchases
      WHERE user_id = $1 AND ${whereStatus} ${whereActive}`,
    [userId]
  );

  const rows = await query(
    `SELECT * FROM purchases
      WHERE user_id = $1 AND ${whereStatus} ${whereActive}
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3`,
    [userId, pageSize, offset]
  );

  return { total: total.rows[0].n, rows: rows.rows };
}

async function getFirstItem(purchaseId) {
  const r = await query(
    `SELECT si.id AS stock_id, si.email, si.password, si.extra_note
       FROM purchase_items pi
       JOIN stock_items si ON si.id = pi.stock_item_id
      WHERE pi.purchase_id = $1
      ORDER BY pi.item_index ASC LIMIT 1`,
    [purchaseId]
  );
  return r.rows[0] || null;
}

async function getProduct(purchaseId) {
  const r = await query(
    `SELECT p.* FROM purchases pu
       JOIN products p ON p.id = pu.product_id
      WHERE pu.id = $1`,
    [purchaseId]
  );
  return r.rows[0] || null;
}

module.exports = { getStats, listPurchases, getFirstItem, getProduct };
