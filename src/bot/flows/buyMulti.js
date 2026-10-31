const { Markup } = require('telegraf');
const { query } = require('../../database/connection');
const catalogService = require('../../services/catalogService');
const stockService = require('../../services/stockService');
const purchaseService = require('../../services/purchaseService');
const paymentService = require('../../services/paymentService');
const templateService = require('../../services/templateService');
const userService = require('../../services/userService');
const { formatMoney } = require('../../utils/format');

async function setState(userId, state, payload) {
  await query(
    `INSERT INTO user_states (telegram_id, state, payload, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (telegram_id) DO UPDATE
       SET state = $2, payload = $3, updated_at = NOW()`,
    [userId, state, payload]
  );
}

async function getState(userId) {
  const r = await query(`SELECT * FROM user_states WHERE telegram_id = $1`, [userId]);
  return r.rows[0] || null;
}

async function clearState(userId) {
  await query(`DELETE FROM user_states WHERE telegram_id = $1`, [userId]);
}

async function askQuantity(ctx, user, productId) {
  const product = await catalogService.getById(productId);
  if (!product || !product.active || !product.visible) {
    return ctx.answerCbQuery('Produto indisponível.').catch(() => {});
  }
  await setState(user.telegram_id, 'buy_multi_quantity', { productId });
  const available = await stockService.availableCount(productId);
  await ctx.answerCbQuery().catch(() => {});
  await ctx.reply(
`🛒 <b>Quantos acessos você quer?</b>

📦 Disponível agora: ${available} unidades
💎 Produto: ${product.name}

👇 Digite a quantidade (ex: 1)

✖️ /cancelar para sair`,
    { parse_mode: 'HTML', ...Markup.forceReply() }
  );
}

async function handleQuantity(ctx, user) {
  const state = await getState(user.telegram_id);
  if (!state || state.state !== 'buy_multi_quantity') return false;

  const text = (ctx.message.text || '').trim();
  const qty = parseInt(text, 10);

  if (!Number.isFinite(qty) || qty <= 0 || String(qty) !== text) {
    const payload = state.payload || {};
    if (payload.stockLimit && qty === payload.stockLimit) {
      return _continue(ctx, user, payload.productId, qty);
    }
    await ctx.reply('⚠️ Digite um número inteiro positivo ou /cancelar.');
    return true;
  }
  return _continue(ctx, user, state.payload.productId, qty);
}

async function _continue(ctx, user, productId, quantity) {
  const product = await catalogService.getById(productId);
  if (!product || !product.active || !product.visible) {
    await clearState(user.telegram_id);
    await ctx.reply('Produto indisponível.');
    return true;
  }

  const available = await stockService.availableCount(productId);

  if (available < quantity) {
    if (available === 0) {
      await clearState(user.telegram_id);
      await ctx.reply('⚠️ <b>Sem estoque no momento.</b>\nUse /cancelar para voltar.', { parse_mode: 'HTML' });
      return true;
    }
    await setState(user.telegram_id, 'buy_multi_quantity', { productId, stockLimit: available });
    await ctx.reply(
`⚠️ <b>Opa, estoque baixo!</b>

📦 Temos: ${available} unidades
🛒 Você tentou: ${quantity}

👇 Temos só ${available}, deseja levar?

Digite ${available} ou /cancelar.`,
      { parse_mode: 'HTML' }
    );
    return true;
  }

  await clearState(user.telegram_id);

  const total = Number((Number(product.price) * quantity).toFixed(2));
  const balance = Number(user.balance);

  if (balance >= total) return _doBalance(ctx, user, productId, quantity);
  return _showInsufficient(ctx, user, product, quantity, balance, total);
}

async function _showInsufficient(ctx, user, product, quantity, balance, total) {
  const falta = Number((total - balance).toFixed(2));
  await ctx.reply(
`💳 <b>SALDO INSUFICIENTE, MAS JÁ RESOLVEMOS!</b>

💰 Você tem: R$ ${formatMoney(balance)}
💵 Precisa: R$ ${formatMoney(total)}
⚡ Faltam só: R$ ${formatMoney(falta)}

👇 Gere o PIX da diferença e libere sua compra!`,
    {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.callback(`⚡ Gerar PIX de R$ ${formatMoney(falta)}`, `m:genpix:${product.id}:${quantity}`)],
        [Markup.button.callback('❌ Cancelar', 'nav:welcome')],
      ]),
    }
  );
  return true;
}

async function _doBalance(ctx, user, productId, quantity) {
  try {
    const res = await purchaseService.purchaseWithBalance({
      userId: user.telegram_id,
      productId,
      quantity,
    });
    const updated = await userService.getByTelegram(user.telegram_id);
    const delivery = require('./delivery');
    return delivery.startDelivery(ctx, updated, res, 'balance');
  } catch (err) {
    console.error('[buyMulti] balance', err.message);
    const map = {
      INSUFFICIENT_BALANCE: 'Saldo insuficiente.',
      OUT_OF_STOCK: 'Sem estoque.',
      PRODUCT_INACTIVE: 'Produto inativo.',
    };
    await ctx.reply(`❌ ${map[err.message] || 'Erro ao processar.'}`,
      { parse_mode: 'HTML', ...Markup.inlineKeyboard([[Markup.button.callback('◀️ Voltar', 'nav:catalog')]]) });
    return true;
  }
}

async function generatePixMulti(ctx, user, productId, quantity) {
  const product = await catalogService.getById(productId);
  if (!product) return;
  const balance = Number(user.balance);
  const total = Number((Number(product.price) * quantity).toFixed(2));
  if (balance >= total) return _doBalance(ctx, user, productId, quantity);

  try { await ctx.editMessageText('⚡ <b>Criando seu pagamento…</b>', { parse_mode: 'HTML' }); } catch {}

  let pending;
  try {
    pending = await purchaseService.createPendingPixPurchase({
      userId: user.telegram_id, productId, quantity, balanceUsed: balance,
    });
  } catch (err) {
    console.error('[buyMulti] pending', err.message);
    return ctx.reply('❌ Não foi possível iniciar o PIX.', { parse_mode: 'HTML' });
  }

  let created;
  try {
    created = await paymentService.createPurchasePix({
      userId: user.telegram_id,
      purchaseId: pending.purchaseId,
      amount: pending.pixAmount,
      description: `Compra #${pending.orderShort} — ${product.name} x${quantity}`,
    });
  } catch (err) {
    console.error('[buyMulti] mp', err.message);
    return ctx.reply('❌ Falha ao gerar PIX.');
  }

  const tpl = await templateService.getTemplate('purchase_pix_created');
  const vars = {
    MINUTOS: String(created.minutes),
    VALOR: formatMoney(pending.pixAmount),
    ID: created.payment.mp_payment_id,
    CODIGO_PIX: created.payment.qr_code || '—',
    SALDO_RESERVADO: formatMoney(balance),
    VALOR_PIX: formatMoney(pending.pixAmount),
    TOTAL_DISPONIVEL: formatMoney(Number(balance) + Number(pending.pixAmount)),
  };
  const text = templateService.renderVars(tpl.text, vars);

  const rows = (tpl.buttons_json || []).map(row =>
    row.map(btn => {
      if (btn.action === 'check_pix') return Markup.button.callback(btn.text, `p:check:${created.payment.id}`);
      if (btn.action === 'copy_pix') {
        if (!created.payment.qr_code) return null;
        return { text: '📋 Copiar PIX', copy_text: { text: created.payment.qr_code } };
      }
      return Markup.button.callback(btn.text, btn.callback_data || 'noop');
    }).filter(Boolean)
  ).filter(r => r.length > 0);

  let sent;
  try {
    await ctx.editMessageText(text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(rows) });
    sent = ctx.callbackQuery?.message;
  } catch {
    sent = await ctx.reply(text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(rows) });
  }
  if (sent?.message_id) {
    await query(`UPDATE purchases SET pix_chat_id = $1, pix_message_id = $2 WHERE id = $3`,
      [ctx.chat.id, sent.message_id, pending.purchaseId]);
  }
  return true;
}

module.exports = { askQuantity, handleQuantity, generatePixMulti, getState, clearState };
