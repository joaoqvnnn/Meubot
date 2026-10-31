const userService = require('../../services/userService');
const { editToWelcome } = require('../flows/welcome');
const env = require('../../config/env');

const ALLOWED = ['member', 'administrator', 'creator'];

function matchesChannel(chat) {
  const target = String(env.CHANNEL_ID).replace(/^@/, '').toLowerCase();
  if (String(chat.id) === String(env.CHANNEL_ID)) return true;
  if (chat.username && chat.username.toLowerCase() === target) return true;
  return false;
}

module.exports = (bot) => {
  bot.on('chat_member', async (ctx) => {
    const upd = ctx.update.chat_member;
    if (!matchesChannel(upd.chat)) return;
    if (!ALLOWED.includes(upd.new_chat_member.status)) return;

    const tgUser = upd.new_chat_member.user;
    const user = await userService.getByTelegram(tgUser.id);
    if (!user) return;

    await userService.setChannelVerified(tgUser.id, true);

    const edited = await editToWelcome(bot, user);
    if (!edited) {
      // fallback: usuário fechou o chat ou mensagem sumiu — envia novo (não duplica se já foi enviado)
      try {
        await bot.telegram.sendMessage(
          tgUser.id,
          '✅ <b>Acesso liberado!</b>\nDigite /start para continuar.',
          { parse_mode: 'HTML' }
        );
      } catch (_) {}
    }
  });
};
