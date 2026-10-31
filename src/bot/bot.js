const { Telegraf } = require('telegraf');
const env = require('../config/env');

function createBot() {
  const bot = new Telegraf(env.BOT_TOKEN);

  bot.catch((err, ctx) => {
    console.error(`[bot] erro em ${ctx.updateType}:`, err);
  });

  require('./commands/start')(bot);
  require('./commands/cancelar')(bot);
  require('./handlers/textState')(bot);
  require('./callbacks/router')(bot);
  require('./events/chatMember')(bot);

  return bot;
}

module.exports = { createBot };
