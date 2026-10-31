const { query } = require('../../database/connection');
const userService = require('../../services/userService');
const { showWelcome } = require('../flows/welcome');

module.exports = (bot) => {
  bot.command('cancelar', async (ctx) => {
    await query(`DELETE FROM user_states WHERE telegram_id = $1`, [ctx.from.id]);
    const user = await userService.getByTelegram(ctx.from.id);
    if (!user) return ctx.reply('Digite /start para começar.');
    await showWelcome(ctx, user);
  });
};
