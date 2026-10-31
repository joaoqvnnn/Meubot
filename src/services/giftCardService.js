const { pool, query } = require('../database/connection');

async function redeem(userId, code) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const gc = await client.query(
      `SELECT * FROM gift_cards WHERE code = $1 FOR UPDATE`,
      [code]
    );
    if (!gc.rows[0]) throw new Error('NOT_FOUND');
    const gift = gc.rows[0];
    if (!gift.active) throw new Error('INACTIVE');
    if (gift.used_by) throw new Error('USED');
    if (gift.expires_at && new Date(gift.expires_at) < new Date()) throw new Error('EXPIRED');

    const u = await client.query(
      `SELECT * FROM users WHERE telegram_id = $1 FOR UPDATE`,
      [userId]
    );
    if (!u.rows[0]) throw new Error('USER_NOT_FOUND');
    const user = u.rows[0];

    const newBalance = Number((Number(user.balance) + Number(gift.value)).toFixed(2));
    await client.query(
      `UPDATE users SET balance = $1, updated_at = NOW() WHERE telegram_id = $2`,
      [newBalance, userId]
    );
    await client.query(
      `UPDATE gift_cards SET used_by = $1, used_at = NOW() WHERE id = $2`,
      [userId, gift.id]
    );
    await client.query(
      `INSERT INTO wallet_transactions
        (user_id, amount, balance_before, balance_after, kind, source, related_id, description)
       VALUES ($1, $2, $3, $4, 'credit', 'gift_card', $5, $6)`,
      [userId, gift.value, user.balance, newBalance, gift.id, `Gift card ${gift.code}`]
    );

    const products = await client.query(
      `SELECT p.id, p.name, p.price
         FROM gift_card_products gcp
         JOIN products p ON p.id = gcp.product_id
        WHERE gcp.gift_card_id = $1 AND p.active = TRUE AND p.visible = TRUE
        ORDER BY p.sort_order ASC`,
      [gift.id]
    );

    await client.query('COMMIT');
    return {
      gift,
      newBalance,
      products: products.rows,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { redeem };
