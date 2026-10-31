const { Markup } = require('telegraf');
const templateService = require('../../services/templateService');
const purchaseService = require('../../services/purchaseService');
const paymentService = require('../../services/paymentService');
const catalogService = require('../../services/catalogService');
const userService = require('../../services/userService');
const { formatMoney } = require('../../utils/format');
const { getSetting } = require('../../services/settingsService');

function maskEmail(email) {
  if (!email) return '—';
  const [local, domain] = email.split('@');
  if (!domain) return '•••';
  const visible = local.slice(0, 1);
  return `${visible}${'*'.repeat(Math.max(2, local.length - 1))}@${domain}`;
}

function maskPassword() {
  return '••••••••';
}

function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('pt-BR');
}

async function _editOrSend(ctx, text, extra) {
  if (ctx.updateType === 'callback_query') {
    try {
      await ctx.editMessageText(text, extra);
      return ctx.callbackQuery.message;
    } catch {
      return ctx.reply(text, extra);
    }
  }
  return ctx.reply(text, extra);
}

async function startPurchase(ctx, user, productId) {
  const product = await catalogService.getById(productId);
  if (!product || !product.active || !product.visible) {
    await ctx.answerCbQuery('Produto indisponível.').catch(() => {});
    return;
  }
  const stock = await catalogService.listActive(1, 0);
  const stockCount = await catalogService.getSalesCount; // placeholder
  // usar contagem real
  const available = require('../../services/stockService');
  const qty = await available.availableCount(productId);
  if (qty <= 0) {
    await ctx.answerCbQuery('Sem estoque.').catch(() => {});
    return _editOrSend(ctx,
      '⚠️ <b>Sem estoque no momento.</b>',
      { parse_mode: 'HTML', ...Markup.inlineKeyboard([[Markup.button.callback('◀️ Voltar', 'nav:catalog')]]) });
  }

  const balance = Number(user.balance);
  const price = Number(product.price);

  if (balance >= price) {
    return _doBalancePurchase(ctx, user, productId, 1);
  }
  return _showInsufficient(ctx, user, product, balance, price);
}

async function _showInsufficient(ctx, user, product, balance, price) {
  const tpl = await templateService.getTemplate('purchase_insufficient');
  const falta = Math.max(0, Number((price - balance).toFixed(2)));
  const vars = {
    SALDO: formatMoney(balance),
    VALOR: formatMoney(price),
    FALTA: formatMoney(falta),
  };
  const text = templateService.renderVars(tpl.text, vars);
  const rows = (tpl.buttons_json || []).map(row =>
    row.map(btn => {
      const cb = btn.action === 'gen_pix'
        ? `p:genpix:${product.id}:1`
        : btn.callback_data;
      return Markup.button.callback(templateService.renderVars(btn.text, vars), cb);
    })
  );
  const extra = { parse_mode: 'HTML', ...Markup.inlineKeyboard(rows) };
  const sent = await _editOrSend(ctx, text, extra);
  if (sent?.message_id) {
    await userService.setLastBotMessage(user.telegram_id, sent.message_id);
  }
}

async function _doBalancePurchase(ctx, user, productId, quantity) {
  try {
    const res = await purchaseService.purchaseWithBalance({
      userId: user.telegram_id,
      productId,
      quantity,
    });
    const updated = await userService.getByTelegram(user.telegram_id);
    return renderApproved(ctx, updated, res, 'balance');
  } catch (err) {
    console.error('[purchase] balance', err.message);
    const map = {
      INSUFFICIENT_BALANCE: 'Saldo insuficiente.',
      OUT_OF_STOCK: 'Sem estoque.',
      PRODUCT_INACTIVE: 'Produto inativo.',
    };
    return _editOrSend(ctx, `❌ ${map[err.message] || 'Erro ao processar.'}`,
      { parse_mode: 'HTML', ...Markup.inlineKeyboard([[Markup.button.callback('◀️ Voltar', 'nav:catalog')]]) });
  }
}

async function renderApproved(ctx, user, res, mode, paymentMinutes = 0) {
  const purchase = await purchaseService.getPurchaseById(res.purchaseId);
  const product = await purchaseService.getProductForPurchase(res.purchaseId);
  const items = await purchaseService.getPurchaseItems(res.purchaseId);

  const tplKey = mode === 'pix' ? 'purchase_approved_pix' : 'purchase_approved_balance';
  const tpl = await templateService.getTemplate(tplKey);
  const first = items[0] || {};

  const showReal = false;
  const emailDisplay = showReal ? first.email : maskEmail(first.email);
  const senhaDisplay = showReal ? first.password : maskPassword();

  const vars = {
    ORDER_SHORT: purchase.order_short_id,
    PURCHASE_ID: String(purchase.id),
    PRODUTO: product.name,
    VALOR: formatMoney(purchase.total),
    SALDO_ANT: formatMoney(res.balanceBefore ?? 0),
    SALDO_ATUAL: formatMoney(res.balanceAfter ?? user.balance),
    SALDO_UTILIZADO: formatMoney(res.balanceUsed ?? purchase.balance_used),
    VALOR_PIX: formatMoney(res.pixUsed ?? purchase.pix_used ?? 0),
    DATA: fmtDate(purchase.created_at),
    VENC: fmtDate(purchase.expires_at),
    EMAIL: emailDisplay,
    SENHA: senhaDisplay,
    NOTA: product.note || '—',
  };
  const text = templateService.renderVars(tpl.text, vars);

  const rows = (tpl.buttons_json || []).map(row =>
    row.map(btn => {
      if (btn.action === 'toggle_cred') {
        return Markup.button.callback('👁️ Ativar', `p:cred:${purchase.id}:show`);
      }
      if (btn.action === 'site') {
        if (!product.site_url) return null;
        return Markup.button.url('🌐 Ir para o site', product.site_url);
      }
      return Markup.button.callback(templateService.renderVars(btn.text, vars), btn.callback_data);
    }).filter(Boolean)
  ).filter(r => r.length > 0);

  const extra = { parse_mode: 'HTML', ...Markup.inlineKeyboard(rows) };
  return _editOrSend(ctx, text, extra);
}

async function toggleCredentials(ctx, purchaseId, show) {
  const purchase = await purchaseService.getPurchaseById(purchaseId);
  if (!purchase || purchase.user_id !== ctx.from.id) {
    return ctx.answerCbQuery('Sem permissão.').catch(() => {});
  }
  const product = await purchaseService.getProductForPurchase(purchaseId);
  const items = await purchaseService.getPurchaseItems(purchaseId);
  const first = items[0] || {};

  const mode = purchase.pix_used > 0 ? 'pix' : 'balance';
  const tplKey = mode === 'pix' ? 'purchase_approved_pix' : 'purchase_approved_balance';
  const tpl = await templateService.getTemplate(tplKey);

  const emailDisplay = show ? first.email : maskEmail(first.email);
  const senhaDisplay = show ? first.password : maskPassword();

  const vars = {
    ORDER_SHORT: purchase.order_short_id,
    PURCHASE_ID: String(purchase.id),
    PRODUTO: product.name,
    VALOR: formatMoney(purchase.total),
    SALDO_ANT: '—',
    SALDO_ATUAL: '—',
    SALDO_UTILIZADO: formatMoney(purchase.balance_used),
    VALOR_PIX: formatMoney(purchase.pix_used),
    DATA: fmtDate(purchase.created_at),
    VENC: fmtDate(purchase.expires_at),
    EMAIL: emailDisplay,
    SENHA: senhaDisplay,
    NOTA: product.note || '—',
  };
  const text = templateService.renderVars(tpl.text, vars);

  const rows = (tpl.buttons_json || []).map(row =>
    row.map(btn => {
      if (btn.action === 'toggle_cred') {
        return Markup.button.callback(
          show ? '🙈 Desativar' : '👁️ Ativar',
          `p:cred:${purchase.id}:${show ? 'hide' : 'show'}`
        );
      }
      if (btn.action === 'site') {
        if (!product.site_url) return null;
        return Markup.button.url('🌐 Ir para o site', product.site_url);
      }
      return Markup.button.callback(templateService.renderVars(btn.text, vars), btn.callback_data);
    }).filter(Boolean)
  ).filter(r => r.length > 0);

  await ctx.answerCbQuery(show ? 'Dados revelados.' : 'Dados ocultados.').catch(() => {});
  try {
    await ctx.editMessageText(text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(rows) });
  } catch {}
}

async function generatePix(ctx, user, productId, quantity) {
  const product = await catalogService.getById(productId);
  if (!product) return;

  const balance = Number(user.balance);
  const total = Number(product.price) * quantity;
  if (balance >= total) {
    return _doBalancePurchase(ctx, user, productId, quantity);
  }

  await _editOrSend(ctx, '⚡ <b>Criando seu pagamento…</b>', { parse_mode: 'HTML' });

  let pending;
  try {
    pending = await purchaseService.createPendingPixPurchase({
      userId: user.telegram_id,
      productId,
      quantity,
      balanceUsed: balance,
    });
  } catch (err) {
    console.error('[purchase] pending', err.message);
    return _editOrSend(ctx, '❌ Não foi possível iniciar o PIX. Tente novamente.',
      { parse_mode: 'HTML', ...Markup.inlineKeyboard([[Markup.button.callback('◀️ Voltar', 'nav:catalog')]]) });
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
    console.error('[purchase] mp', err.message);
    return _editOrSend(ctx, '❌ Falha ao gerar PIX. Tente novamente.',
      { parse_mode: 'HTML', ...Markup.inlineKeyboard([[Markup.button.callback('◀️ Voltar', 'nav:catalog')]]) });
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
      if (btn.action === 'check_pix') {
        return Markup.button.callback(btn.text, `p:check:${created.payment.id}`);
      }
      if (btn.action === 'copy_pix') {
        if (!created.payment.qr_code) return null;
        return { text: '📋 Copiar PIX', copy_text: { text: created.payment.qr_code } };
      }
      return Markup.button.callback(btn.text, btn.callback_data || 'noop');
    }).filter(Boolean)
  ).filter(r => r.length > 0);

  const sent = await _editOrSend(ctx, text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(rows) });
  if (sent?.message_id) {
    await userService.setLastBotMessage(user.telegram_id, sent.message_id);
    const { query } = require('../../database/connection');
    await query(
      `UPDATE purchases SET pix_chat_id = $1, pix_message_id = $2 WHERE id = $3`,
      [sent.chat.id, sent.message_id, pending.purchaseId]
    );
  }
}

async function checkPix(ctx, paymentId) {
  await ctx.answerCbQuery('Consultando...').catch(() => {});
  const payment = await paymentService.refreshFromProvider(paymentId);
  if (!payment) return;

  if (payment.status === 'approved') {
    try {
      const res = await purchaseService.approvePixPurchase({
        purchaseId: payment.purchase_id,
        paymentId: payment.id,
        pixAmount: payment.amount,
      });
      const user = await userService.getByTelegram(payment.user_id);
      const delivery = require('./delivery');
      return delivery.startDelivery(ctx, user, {
        purchaseId: payment.purchase_id,
        balanceBefore: res.balanceBefore,
        balanceAfter: res.balanceAfter,
        pixUsed: res.pixUsed,
        balanceUsed: res.balanceUsed,
      }, 'pix');
    } catch (err) {
      console.error('[purchase] approve', err.message);
      if (err.message === 'STOCK_UNAVAILABLE') {
        return _editOrSend(ctx,
          '⚠️ Pagamento confirmado, mas o estoque acabou. Entre em contato com o suporte para reembolso.',
          { parse_mode: 'HTML' });
      }
    }
    return;
  }

  const expired = await paymentService.expireIfNeeded(paymentId);
  if (expired && expired.status === 'expired') return showExpired(ctx, expired);

  return ctx.answerCbQuery('Pagamento ainda não identificado. Aguarde alguns segundos.').catch(() => {});
}

async function showExpired(ctx, payment) {
  const tpl = await templateService.getTemplate('purchase_pix_expired');
  const vars = {
    PAYMENT_ID: payment.mp_payment_id || String(payment.id),
    VALOR: formatMoney(payment.amount),
  };
  const text = templateService.renderVars(tpl.text, vars);
  const rows = (tpl.buttons_json || []).map(row =>
    row.map(btn => {
      if (btn.action === 'new_pix') {
        return Markup.button.callback(btn.text, `p:newpix:${payment.id}`);
      }
      return Markup.button.callback(btn.text, btn.callback_data || 'noop');
    })
  );
  return _editOrSend(ctx, text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(rows) });
}

async function regeneratePix(ctx, paymentId) {
  const payment = await paymentService.getPaymentById(paymentId);
  if (!payment) return ctx.answerCbQuery('Pagamento não encontrado.').catch(() => {});

  const purchase = await purchaseService.getPurchaseById(payment.purchase_id);
  if (!purchase) return;

  // Requer nova compra pendente — cancelar a antiga e reiniciar
  const product = await purchaseService.getProductForPurchase(purchase.id);
  const user = await userService.getByTelegram(ctx.from.id);
  await ctx.answerCbQuery().catch(() => {});
  return generatePix(ctx, user, product.id, purchase.quantity);
}

module.exports = {
  startPurchase,
  generatePix,
  checkPix,
  showExpired,
  regeneratePix,
  toggleCredentials,
  renderApproved,
};
