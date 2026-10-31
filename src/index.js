const { createBot } = require('./bot/bot');
const { createWebhook } = require('./webhook');
const env = require('./config/env');
const stockService = require('./services/stockService');

async function main() {
  const bot = createBot();

  await bot.launch({
    allowedUpdates: ['message', 'callback_query', 'chat_member', 'my_chat_member'],
  });
  console.log('[bot] iniciado');

  const app = createWebhook(bot);
  app.listen(env.PORT, () => console.log(`[webhook] porta ${env.PORT}`));

  setInterval(() => {
    stockService.releaseExpired().catch(e => console.error('[stock] release', e.message));
  }, 60_000);

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

main().catch((err) => {
  console.error('[index] erro fatal', err);
  process.exit(1);
});
