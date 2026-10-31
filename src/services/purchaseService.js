const { pool, query } = require('../database/connection');
const stockService = require('./stockService');

function shortId() {
  return Math.random().toString(16).slice(2, 8).toUpperCase();
}

async function purchaseWithBalance({ userId, productId, quantity }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const u = await client.query(
      `SELECT * FROM users WHERE telegram_id = $1 FOR UPDATE`,
      [userId]
    );
    if (!u.rows[0]) throw new Error('USER_NOT_FOUND');
    const user = u.rows[0];

    const p = await client.query(
      `SELECT * FROM products WHERE id = $1 FOR UPDATE`,
      [productId]
    );
    if (!p.rows[0]) throw new Error('PRODUCT_NOT_FOUND');
    const product = p.rows[0];
    if (!product.active || !product.visible) throw new Error('PRODUCT_INACTIVE');

    const total = Number(product.price) * quantity;
    const balance = Number(user.balance);
    if (balance < total) throw new Error('INSUFFICIENT_BALANCE');

    const stockIds = [];
    for (let i = 0; i < quantity; i++) {
      const id = await stockService.reserveOne(client, productId, userId, 20);
      if (!id) throw new Error('OUT_OF_STOCK');
      stockIds.push(id);
    }

    const short = shortId();
    const insPurch = await client.query(
      `INSERT INTO purchases
        (user_id, product_id, quantity, unit_price, total, status, order_short_id,
         balance_used, pix_used, expires_at)
       VALUES ($1, $2, $3, $4, $5, 'approved', $6, $7, 0,
               NOW() + ($8 || ' days')::interval)
       RETURNING *`,
      [userId, productId, quantity, product.price, total, short, total,
       String(product.warranty_days)]
    );
    const purchase = insPurch.rows[0];

    for (let i = 0; i < stockIds.length; i++) {
      await stockService.markSold(client, stockIds[i], purchase.id);
      await client.query(
        `INSERT INTO purchase_items (purchase_id, stock_item_id, item_index)
         VALUES ($1, $2, $3)`,
        [purchase.id, stockIds[i], i + 1]
      );
    }

    const newBalance = balance - total;
    await client.query(
      `UPDATE users SET balance = $1, updated_at = NOW() WHERE telegram_id = $2`,
      [newBalance, userId]
    );
    await client.query(
      `INSERT INTO wallet_transactions
        (user_id, amount, balance_before, balance_after, kind, source, related_id, description)
       VALUES ($1, $2, $3, $4, 'debit', 'purchase', $5, $6)`,
      [userId, total, balance, newBalance, purchase.id,
       `Compra ${product.name} x${quantity}`]
    );
    await client.query(
      `UPDATE products SET stock = stock - $1, updated_at = NOW() WHERE id = $2`,
      [quantity, productId]
    );

    await client.query('COMMIT');
    return {
      purchaseId: purchase.id,
      orderShort: purchase.order_short_id,
      balanceBefore: balance,
      balanceAfter: newBalance,
      total,
      productName: product.name,
      quantity,
      expiresAt: purchase.expires_at,
      stockIds,
      pixUsed: 0,
      balanceUsed: total,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function createPendingPixPurchase({ userId, productId, quantity, balanceUsed }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const p = await client.query(
      `SELECT * FROM products WHERE id = $1 FOR UPDATE`,
      [productId]
    );
    if (!p.rows[0]) throw new Error('PRODUCT_NOT_FOUND');
    const product = p.rows[0];
    if (!product.active || !product.visible) throw new Error('PRODUCT_INACTIVE');

    const total = Number(product.price) * quantity;
    const pixAmount = Math.max(0, Number((total - balanceUsed).toFixed(2)));
    if (pixAmount <= 0) throw new Error('NO_PIX_NEEDED');

    const stockIds = [];
    for (let i = 0; i < quantity; i++) {
      const id = await stockService.reserveOne(client, productId, userId, 20);
      if (!id) throw new Error('OUT_OF_STOCK');
      stockIds.push(id);
    }

    const short = shortId();
    const ins = await client.query(
      `INSERT INTO purchases
        (user_id, product_id, quantity, unit_price, total, status, order_short_id,
         balance_used, pix_used, expires_at)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6, 0, 0,
               NOW() + ($7 || ' days')::interval)
       RETURNING *`,
      [userId, productId, quantity, product.price, total, short,
       String(product.warranty_days)]
    );
    const purchase = ins.rows[0];

    for (let i = 0; i < stockIds.length; i++) {
      await client.query(
        `UPDATE stock_items
            SET purchase_id = $1
          WHERE id = $2`,
        [purchase.id, stockIds[i]]
      );
    }

    await client.query('COMMIT');
    return {
      purchaseId: purchase.id,
      orderShort: purchase.order_short_id,
      pixAmount,
      total,
      productName: product.name,
      quantity,
      expiresAt: purchase.expires_at,
      stockIds,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function approvePixPurchase({ purchaseId, paymentId, pixAmount }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const pay = await client.query(
      `SELECT * FROM payments WHERE id = $1 FOR UPDATE`,
      [paymentId]
    );
    if (!pay.rows[0]) throw new Error('PAYMENT_NOT_FOUND');
    if (pay.rows[0].status === 'approved') {
      await client.query('COMMIT');
      return { already: true };
    }

    const purch = await client.query(
      `SELECT * FROM purchases WHERE id = $1 FOR UPDATE`,
      [purchaseId]
    );
    if (!purch.rows[0]) throw new Error('PURCHASE_NOT_FOUND');
    const purchase = purch.rows[0];
    if (purchase.status === 'approved' || purchase.status === 'completed') {
      await client.query('COMMIT');
      return { already: true };
    }

    const u = await client.query(
      `SELECT * FROM users WHERE telegram_id = $1 FOR UPDATE`,
      [purchase.user_id]
    );
    const user = u.rows[0];

    const items = await client.query(
      `SELECT pi.id AS item_id, si.id AS stock_id, si.status AS stock_status
         FROM purchase_items pi
         JOIN stock_items si ON si.id = pi.stock_item_id
        WHERE pi.purchase_id = $1
        ORDER BY pi.item_index ASC
        FOR UPDATE`,
      [purchaseId]
    );
    if (items.rows.length !== purchase.quantity ||
        items.rows.some(i => i.stock_status !== 'reserved')) {
      await client.query(
        `UPDATE payments SET status = 'refund_required', updated_at = NOW() WHERE id = $1`,
        [paymentId]
      );
      await client.query('COMMIT');
      throw new Error('STOCK_UNAVAILABLE');
    }

    const total = Number(purchase.total);
    const balance = Number(user.balance);
    if (balance < purchase.balance_used) throw new Error('BALANCE_CHANGED');

    const newBalance = Number((balance - Number(purchase.balance_used)).toFixed(2));

    for (const row of items.rows) {
      await stockService.markSold(client, row.stock_id, purchaseId);
    }

    await client.query(
      `UPDATE users SET balance = $1, updated_at = NOW() WHERE telegram_id = $2`,
      [newBalance, purchase.user_id]
    );
    await client.query(
      `INSERT INTO wallet_transactions
        (user_id, amount, balance_before, balance_after, kind, source, related_id, description)
       VALUES ($1, $2, $3, $4, 'debit', 'purchase', $5, $6)`,
      [purchase.user_id, purchase.balance_used, balance, newBalance,
       purchaseId, `Compra ${purchase.quantity} un — saldo reservado`]
    );

    await client.query(
      `UPDATE purchases
          SET status = 'approved', pix_used = $1, payment_id = $2
        WHERE id = $3`,
      [pixAmount, paymentId, purchaseId]
    );
    await client.query(
      `UPDATE payments SET status = 'approved', updated_at = NOW() WHERE id = $1`,
      [paymentId]
    );
    await client.query(
      `UPDATE products
          SET stock = stock - $1, updated_at = NOW()
        WHERE id = $2`,
      [purchase.quantity, purchase.product_id]
    );

    await client.query('COMMIT');
    return {
      already: false,
      purchaseId,
      orderShort: purchase.order_short_id,
      balanceBefore: balance,
      balanceAfter: newBalance,
      total,
      pixUsed: Number(pixAmount),
      balanceUsed: Number(purchase.balance_used),
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getPurchaseItems(purchaseId) {
  const r = await query(
    `SELECT pi.item_index, si.email, si.password, si.extra_note, si.id AS stock_id
       FROM purchase_items pi
       JOIN stock_items si ON si.id = pi.stock_item_id
      WHERE pi.purchase_id = $1
      ORDER BY pi.item_index ASC`,
    [purchaseId]
  );
  return r.rows;
}

async function getPurchaseById(purchaseId) {
  const r = await query(`SELECT * FROM purchases WHERE id = $1`, [purchaseId]);
  return r.rows[0] || null;
}

async function getProductForPurchase(purchaseId) {
  const r = await query(
    `SELECT p.* FROM purchases pu
       JOIN products p ON p.id = pu.product_id
      WHERE pu.id = $1`,
    [purchaseId]
  );
  return r.rows[0] || null;
}

module.exports = {
  purchaseWithBalance,
  createPendingPixPurchase,
  approvePixPurchase,
  getPurchaseItems,
  getPurchaseById,
  getProductForPurchase,
};
