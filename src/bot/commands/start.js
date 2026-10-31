const userService = require('../../services/userService');
const channelService = require('../../services/channelService');
const templateService = require('../../services/templateService');
const env = require('../../config/env');
const { showWelcome } = require('../flows/welcome');

module.exports = (bot) => {
  bot.start(async (ctx) => {
    // Registro obrigatório
    const user = await userService.findOrCreateByTelegram(ctx);

    // Verificação do canal
    const member = await channelService.isMember(bot, user.telegram_id);

    if (!member) {
      await showChannelBlock(ctx);
      return;
    }

    await userService.setChannelVerified(user.telegram_id, true);
    await showWelcome(ctx, user);
  });
};

async function showChannelBlock(ctx) {
  const template = await templateService.getTemplate('channel_block');
  if (!template) return;

  const text = templateService.renderVars(template.text, {});
  const extra = {
    parse_mode: 'HTML',
    ...templateService.buildInlineKeyboard(
      [[{ text: '📢 Entrar no canal', url: env.CHANNEL_LINK }]],
      {}
    ),
  };

  let sent;
  if (ctx.updateType === 'callback_query') {
    try {
      await ctx.editMessageText(text, extra);
      sent = ctx.callbackQuery.message;
    } catch {
      sent = await ctx.reply(text, extra);
    }
  } else {
    sent = await ctx.reply(text, extra);
  }

  if (sent?.message_id) {
    await userService.setLastBotMessage(ctx.from.id, sent.message_id);
  }
}
