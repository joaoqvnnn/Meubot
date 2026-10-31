const { Markup } = require('telegraf');
const purchaseService = require('../../services/purchaseService');
const templateService = require('../../services/templateService');
const { formatMoney } = require('../../utils/format');

function maskEmail(email) {
  if (!email) return '—';
  const [local, domain] = email.split('@');
  if (!domain) return '•••';
  return `${local.slice(0, 1)}${'*'.repeat(Math.max(2, local.length - 1))}@${domain}`;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR');
}

async function _editOrSend(ctx, text, extra) {
  if (ctx.updateType === 'callback_query') {
    try { await ctx.editMessageText(text, extra); return; } catch {}
  }
  return ctx.reply(text, extra);
}

async function startDelivery(ctx, user, res, mode = null) {
  const purchase = await purchaseService.getPurchaseById(res.purchaseId);
  if (!purchase) return;
  const effectiveMode = mode || (Number(purchase.pix_used) > 0 ? 'pix' : 'balance');

  if (purchase.quantity <= 1) {
    const purchaseFlow = require('./purchase');
    return purchaseFlow.renderApproved(ctx, user, {
      purchaseId: purchase.id,
      balanceBefore: res.balanceBefore ?? 0,
      balanceAfter: res.balanceAfter ?? user.balance,
      pixUsed: purchase.pix_used,
      balanceUsed: purchase.balance_used,
    }, effectiveMode);
  }

  return showMultiSummary(ctx, user, purchase, effectiveMode, res);
}

async function showMultiSummary(ctx, user, purchase, mode, res) {
  const product = await purchaseService.getProductForPurchase(purchase.id);
  const tplKey = mode === 'pix' ? 'purchase_multi_approved_pix' : 'purchase_multi_approved';
  const tpl = await templateService.getTemplate(tplKey);
  if (!tpl) return;

  const vars = {
    ORDER_SHORT: purchase.order_short_id,
    PRODUTO: product.name,
    QTD: String(purchase.quantity),
    VALOR_UN: formatMoney(purchase.unit_price),
    VALOR_TOTAL: formatMoney(purchase.total),
    SALDO_ANT: formatMoney(res?.balanceBefore ?? 0),
    SALDO_ATUAL: formatMoney(res?.balanceAfter ?? user.balance),
    SALDO_UTILIZADO: formatMoney(purchase.balance_used),
    VALOR_PIX: formatMoney(purchase.pix_used),
    DATA: fmtDate(purchase.created_at),
  };
  const text = templateService.renderVars(tpl.text, vars);

  const rows = (tpl.buttons_json || []).map(row =>
    row.map(btn => {
      if (btn.action === 'view_items') {
        return Markup.button.callback(
          templateService.renderVars(btn.text, vars),
          `d:view:${purchase.id}:${mode}`
        );
      }
      return Markup.button.callback(templateService.renderVars(btn.text, vars), btn.callback_data);
    })
  );

  return _editOrSend(ctx, text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(rows) });
}

async function showItem(ctx, user, purchaseId, index, showReal) {
  const purchase = await purchaseService.getPurchaseById(purchaseId);
  if (!purchase) return;
  if (purchase.user_id !== user.telegram_id) {
    return ctx.answerCbQuery('Sem permissão.').catch(() => {});
  }

  const product = await purchaseService.getProductForPurchase(purchaseId);
  const items = await purchaseService.getPurchaseItems(purchaseId);
  if (items.length === 0) return;

  const safeIndex = Math.max(0, Math.min(index, items.length - 1));
  const item = items[safeIndex];
  const pos = safeIndex + 1;
  const total = items.length;
  const mode = Number(purchase.pix_used) > 0 ? 'pix' : 'balance';

  const tpl = await templateService.getTemplate('delivery_item');
  const vars = {
    POS: String(pos),
    TOTAL: String(total),
    ORDER_SHORT: purchase.order_short_id,
    PRODUTO: product.name,
    DATA: fmtDate(purchase.created_at),
    VENC: fmtDate(purchase.expires_at),
    VALOR: formatMoney(purchase.unit_price),
    ID: String(item.stock_id),
    EMAIL: showReal ? item.email : maskEmail(item.email),
    SENHA: showReal ? item.password : '••••••••',
    REF: item.extra_note || '—',
  };
  const text = templateService.renderVars(tpl.text, vars);

  const nav = [];
  if (safeIndex > 0) {
    nav.push(Markup.button.callback('◀️ Voltar', `d:nav:${purchaseId}:${safeIndex - 1}:${showReal ? 'show' : 'hide'}`));
  }
  nav.push(Markup.button.callback(
    showReal ? '🙈 Desativar' : '👁️ Ativar',
    `d:cred:${purchaseId}:${safeIndex}:${showReal ? 'hide' : 'show'}`
  ));
  if (product.site_url) nav.push(Markup.button.url('🌐 Site', product.site_url));
  if (safeIndex < total - 1) {
    nav.push(Markup.button.callback('Avançar ▶️', `d:nav:${purchaseId}:${safeIndex + 1}:${showReal ? 'show' : 'hide'}`));
  }

  const rows = [nav, [Markup.button.callback(`${pos}/${total}`, 'noop')], [Markup.button.callback('◀️ Voltar ao catálogo', 'nav:catalog')]];

  await ctx.answerCbQuery().catch(() => {});
  return _editOrSend(ctx, text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(rows) });
}

module.exports = { startDelivery, showItem, showMultiSummary };
