const userService = require('../../services/userService');
const buyMulti = require('../flows/buyMulti');
const giftCard = require('../flows/giftCard');

module.exports = (bot) => {
  bot.on('text', async (ctx, next) => {
    if (ctx.message.text && ctx.message.text.startsWith('/')) return next();
    const user = await userService.getByTelegram(ctx.from.id);
    if (!user) return next();

    if (await buyMulti.handleQuantity(ctx, user)) return;
    if (await giftCard.handleGiftCode(ctx, user)) return;

    return next();
  });
};
