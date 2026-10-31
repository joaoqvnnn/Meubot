const { Markup } = require('telegraf');
const { query } = require('../../database/connection');
const templateService = require('../../services/templateService');
const giftCardService = require('../../services/giftCardService');
const settingsService = require('../../services/settingsService');
const userService = require('../../services/userService');
const { formatMoney } = require('../../utils/format');

async function askGift(ctx, user) {
  await query(
    `INSERT INTO user_states (telegram_id, state, payload, updated_at)
     VALUES ($1, 'gift_code', '{}'::jsonb, NOW())
     ON CONFLICT (telegram_id) DO UPDATE
       SET state = 'gift_code', payload = '{}'::jsonb, updated_at = NOW()`,
    [user.telegram_id]
  );

  const tpl = await templateService.getTemplate('profile_gift_prompt');
  const example = await settingsService.getSetting('gift_code_example', 'ABC123XYZ456');
  const length = await settingsService.getSetting('gift_code_length', '12');
  const vars = { EXEMPLO_GIFT: example, QTD_CHARS: length };
  const text = templateService.renderVars(tpl.text, vars);

  await ctx.answerCbQuery().catch(() => {});
  await ctx.reply(text, { parse_mode: 'HTML', ...Markup.forceReply() });
}

async function handleGiftCode(ctx, user) {
  const state = await query(`SELECT * FROM user_states WHERE telegram_id = $1`, [user.telegram_id]);
  if (!state.rows[0] || state.rows[0].state !== 'gift_code') return false;

  const code = (ctx.message.text || '').trim().toUpperCase();
  if (!code) return true;

  const example = await settingsService.getSetting('gift_code_example', 'ABC123XYZ456');

  let result;
  try {
    result = await giftCardService.redeem(user.telegram_id, code);
  } catch (err) {
    const tpl = await templateService.getTemplate('profile_gift_invalid');
    const text = templateService.renderVars(tpl.text, { CODIGO: code, EXEMPLO_GIFT: example });
    await ctx.reply(text, { parse_mode: 'HTML', ...Markup.forceReply() });
    return true;
  }

  await query(`DELETE FROM user_states WHERE telegram_id = $1`, [user.telegram_id]);

  const tpl = await templateService.getTemplate('profile_gift_success');
  const vars = {
    CODIGO_GIFT: result.gift.code,
    VALOR_GIFT: formatMoney(result.gift.value),
    SALDO_ATUAL: formatMoney(result.newBalance),
  };
  const text = templateService.renderVars(tpl.text, vars);

  const rows = [];
  for (const p of result.products) {
    rows.push([Markup.button.callback(
      `${p.name} — R$ ${formatMoney(p.price)}`,
      `cat:prod:${p.id}`
    )]);
  }
  if (rows.length === 0) {
    rows.push([Markup.button.callback('🛍️ Ver Catálogo', 'nav:catalog')]);
  }
  rows.push([Markup.button.callback('◀️ Meu Perfil', 'nav:profile')]);

  await ctx.reply(text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(rows) });
  return true;
}

module.exports = { askGift, handleGiftCode };
