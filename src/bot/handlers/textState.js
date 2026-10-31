const userService = require('../../services/userService');
const buyMulti = require('../flows/buyMulti');

module.exports = (bot) => {
  bot.on('text', async (ctx, next) => {
    if (ctx.message.text && ctx.message.text.startsWith('/')) return next();
    const user = await userService.getByTelegram(ctx.from.id);
    if (!user) return next();

    const handled = await buyMulti.handleQuantity(ctx, user);
    if (handled) return;

    return next();
  });
};
