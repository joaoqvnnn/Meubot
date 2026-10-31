const env = require('../config/env');

const BASE = 'https://api.mercadopago.com';

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.MERCADOPAGO_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': body?._idem || crypto.randomUUID(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('[mp] erro', res.status, data);
    throw new Error(`MP ${res.status}: ${data.message || 'erro'}`);
  }
  return data;
}

async function createPix({ amount, description, externalReference, payerEmail }) {
  const body = {
    transaction_amount: Number(Number(amount).toFixed(2)),
    description,
    payment_method_id: 'pix',
    external_reference: externalReference,
    payer: { email: payerEmail || 'cliente@larizinha.store' },
  };
  const data = await request('POST', '/v1/payments', body);
  const tx = data.point_of_interaction?.transaction_data || {};
  return {
    id: String(data.id),
    status: data.status,
    qr_code: tx.qr_code || null,
    qr_code_base64: tx.qr_code_base64 || null,
    ticket_url: tx.ticket_url || null,
    raw: data,
  };
}

async function getPayment(paymentId) {
  const data = await request('GET', `/v1/payments/${paymentId}`);
  return { id: String(data.id), status: data.status, raw: data };
}

module.exports = { createPix, getPayment };
