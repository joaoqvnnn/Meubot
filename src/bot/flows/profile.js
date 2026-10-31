const { Markup } = require('telegraf');
const { query } = require('../../database/connection');
const templateService = require('../../services/templateService');
const profileService = require('../../services/profileService');
const userService = require('../../services/userService');
const { formatMoney } = require('../../utils/format');

function maskPhone(phone) {
  if (!phone) return '—';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length < 4) return '•'.repeat(digits.length);
  return '•'.repeat(Math.max(0, digits.length - 4)) + digits.slice(-4);
}

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

async function showProfile(ctx, user) {
  const tpl = await templateService.getTemplate('profile_panel');
  const stats = await profileService.getStats(user.telegram_id);
  const vars = {
    ID_CARTEIRA: String(user.telegram_id),
    SALDO: formatMoney(user.balance),
    WHATSAPP: maskPhone(user.whatsapp),
    QTD_COMPRAS: String(stats.qtd_compras),
    TOTAL_GASTO: formatMoney(stats.total_gasto),
    PIX_INSERIDO: formatMoney(stats.pix_inserido),
    GIFTS: String(stats.gifts),
  };
  const text = templateService.renderVars(tpl.text, vars);
  const rows = (tpl.buttons_json || []).map(row =>
    row.map(btn => Markup.button.callback(templateService.renderVars(btn.text, vars), btn.callback_data))
  );
  await ctx.answerCbQuery().catch(() => {});
  return _editOrSend(ctx, text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(rows) });
}

async function showHistory(ctx, user, page, filter) {
  const pageSize = 1;
  const onlyActive = filter === 'active';
  const { total, rows } = await profileService.listPurchases(user.telegram_id, page, pageSize, onlyActive);

  if (total === 0) {
    const tpl = await templateService.getTemplate(
      onlyActive ? 'profile_no_active' : 'profile_no_purchases'
    );
    const extra = {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard(
        (tpl.buttons_json || []).map(row =>
          row.map(btn => Markup.button.callback(btn.text, btn.callback_data))
        )
      ),
    };
    await ctx.answerCbQuery().catch(() => {});
    return _editOrSend(ctx, templateService.renderVars(tpl.text, {}), extra);
  }

  const safePage = Math.max(0, Math.min(page, total - 1));
  const purchase = rows[0];
  const product = await profileService.getProduct(purchase.id);
  const item = await profileService.getFirstItem(purchase.id);

  const tpl = await templateService.getTemplate('profile_history');
  const vars = {
    ATUAL: String(safePage + 1),
    TOTAL: String(total),
    DATA_COMPRA: fmtDate(purchase.created_at),
    DATA_VENC: fmtDate(purchase.expires_at),
    VALOR: formatMoney(purchase.total),
    ID_COMPRA: String(purchase.id),
    SERVICO: product?.name || '—',
    EMAIL: item ? maskEmail(item.email) : '—',
    SENHA: '••••••••',
    NOTA: product?.note || '—',
    REF: item?.extra_note || '—',
  };
  const text = templateService.renderVars(tpl.text, vars);

  const nav = [];
  if (safePage > 0) nav.push(Markup.button.callback('◀️ Anterior', `prof:history:${safePage - 1}:${filter}`));
  if (safePage < total - 1) nav.push(Markup.button.callback('Próxima ▶️', `prof:history:${safePage + 1}:${filter}`));

  const rowsKb = [];
  if (nav.length) rowsKb.push(nav);

  if (purchase.quantity > 1) {
    rowsKb.push([Markup.button.callback(`▶️ Ver ${purchase.quantity} contas`, `d:view:${purchase.id}:balance`)]);
  }

  const filterBtn = onlyActive
    ? Markup.button.callback('☑️ Apenas ativas', `prof:history:0:all`)
    : Markup.button.callback('✅ Apenas ativas', `prof:history:0:active`);
  rowsKb.push([filterBtn]);
  rowsKb.push([Markup.button.callback('◀️ Voltar', 'nav:profile')]);

  await ctx.answerCbQuery().catch(() => {});
  return _editOrSend(ctx, text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(rowsKb) });
}

module.exports = { showProfile, showHistory, maskPhone, maskEmail };
