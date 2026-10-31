const env = require('../config/env');

const ALLOWED = ['creator', 'administrator', 'member'];

async function isMember(bot, telegramId) {
  try {
    const m = await bot.telegram.getChatMember(env.CHANNEL_ID, telegramId);
    return ALLOWED.includes(m.status);
  } catch (err) {
    console.error('[channelService] erro getChatMember:', err.message);
    return false;
  }
}

module.exports = { isMember };
