const { createBot } = require('./bot/bot');

async function main() {
  const bot = createBot();

  await bot.launch({
    allowedUpdates: ['message', 'callback_query', 'chat_member', 'my_chat_member'],
  });

  console.log('[bot] iniciado');

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

main().catch((err) => {
  console.error('[index] erro fatal', err);
  process.exit(1);
});
