const templateService = require('../../services/templateService');
const settingsService = require('../../services/settingsService');
const userService = require('../../services/userService');
const { formatMoney } = require('../../utils/format');

async function renderWelcome(user) {
  const template = await templateService.getTemplate('welcome');
  if (!template) return null;
  const stats = await settingsService.getStoreStats();
  const vars = {
    USER_ID: String(user.telegram_id),
    SALDO: formatMoney(user.balance),
    TOTAL_CLIENTES: String(stats.total_clients),
  };
  const text = templateService.renderVars(template.text, vars);
  const extra = {
    parse_mode: 'HTML',
    ...templateService.buildInlineKeyboard(template.buttons_json, vars),
  };
  return { template, text, extra };
}

async function showWelcome(ctx, user) {
  const rendered = await renderWelcome(user);
  if (!rendered) return;
  const { template, text, extra } = rendered;

  let sent;
  const isCallback = ctx.updateType === 'callback_query';

  if (template.media_url && template.media_url.trim()) {
    if (isCallback) {
      try {
        await ctx.editMessageMedia(
          { type: 'photo', media: template.media_url, caption: text, parse_mode: 'HTML' },
          extra
        );
        sent = ctx.callbackQuery.message;
      } catch {
        sent = await ctx.replyWithPhoto(template.media_url, { caption: text, ...extra });
      }
    } else {
      sent = await ctx.replyWithPhoto(template.media_url, { caption: text, ...extra });
    }
  } else {
    if (isCallback) {
      try {
        await ctx.editMessageText(text, extra);
        sent = ctx.callbackQuery.message;
      } catch {
        sent = await ctx.reply(text, extra);
      }
    } else {
      sent = await ctx.reply(text, extra);
    }
  }

  if (sent?.message_id) {
    await userService.setLastBotMessage(user.telegram_id, sent.message_id);
  }
  return sent;
}

async function editToWelcome(bot, user) {
  if (!user.last_bot_message_id) return false;
  const rendered = await renderWelcome(user);
  if (!rendered) return false;
  const { template, text, extra } = rendered;
  const chatId = user.telegram_id;
  const msgId = user.last_bot_message_id;

  try {
    if (template.media_url && template.media_url.trim()) {
      await bot.telegram.editMessageMedia(
        chatId, msgId, undefined,
        { type: 'photo', media: template.media_url, caption: text, parse_mode: 'HTML' },
        extra
      );
    } else {
      await bot.telegram.editMessageText(chatId, msgId, undefined, text, extra);
    }
    return true;
  } catch (err) {
    console.error('[welcome] falha ao editar:', err.message);
    return false;
  }
}

module.exports = { showWelcome, editToWelcome, renderWelcome };
