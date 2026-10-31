const { query } = require('../database/connection');
const mercadopago = require('./mercadopago');
const { getSetting } = require('./settingsService');

async function createPurchasePix({ userId, purchaseId, amount, description }) {
  const minutes = parseInt(await getSetting('pix_expire_minutes', '30'), 10) || 30;
  const mp = await mercadopago.createPix({
    amount,
    description,
    externalReference: `purchase_${purchaseId}`,
  });

  const ins = await query(
    `INSERT INTO payments
       (user_id, mp_payment_id, amount, status, kind, purchase_id,
        qr_code, qr_code_base64, ticket_url, expires_at, raw)
     VALUES ($1, $2, $3, $4, 'purchase', $5, $6, $7, $8,
             NOW() + ($9 || ' minutes')::interval, $10)
     RETURNING *`,
    [userId, mp.id, amount, mp.status || 'pending', purchaseId,
     mp.qr_code, mp.qr_code_base64, mp.ticket_url, String(minutes), mp.raw]
  );
  return { payment: ins.rows[0], minutes };
}

async function getPaymentById(id) {
  const r = await query(`SELECT * FROM payments WHERE id = $1`, [id]);
  return r.rows[0] || null;
}

async function refreshFromProvider(paymentId) {
  const p = await getPaymentById(paymentId);
  if (!p || !p.mp_payment_id) return p;
  try {
    const mp = await mercadopago.getPayment(p.mp_payment_id);
    if (mp.status !== p.status) {
      await query(
        `UPDATE payments SET status = $1, updated_at = NOW() WHERE id = $2`,
        [mp.status, p.id]
      );
    }
    return { ...p, status: mp.status };
  } catch (err) {
    console.error('[paymentService] refresh', err.message);
    return p;
  }
}

async function expireIfNeeded(paymentId) {
  const p = await getPaymentById(paymentId);
  if (!p) return null;
  if (p.status !== 'pending') return p;
  const r = await query(
    `UPDATE payments
        SET status = 'expired', updated_at = NOW()
      WHERE id = $1 AND status = 'pending' AND expires_at < NOW()
      RETURNING *`,
    [paymentId]
  );
  return r.rows[0] || p;
}

module.exports = { createPurchasePix, getPaymentById, refreshFromProvider, expireIfNeeded };
