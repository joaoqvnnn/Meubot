const userService = require('../../services/userService');
const { showWelcome } = require('../flows/welcome');

const PENDING = {
  'nav:catalog':   'Módulo 3 (Catálogo)',
  'nav:profile':   'Módulo 6 (Meu Perfil)',
  'nav:recharge':  'Módulo 8 (Recarregar Saldo)',
  'nav:affiliate': 'Módulo 9 (Afiliados)',
  'nav:rankings':  'Módulo 12 (Rankings)',
  'nav:cart':      'Módulo 14 (Carrinho)',
};

module.exports = (bot) => {
  bot.on('callback_query', async (ctx) => {
    const data = ctx.callbackQuery.data || '';

    if (data === 'noop') return ctx.answerCbQuery().catch(() => {});

    if (data === 'nav:welcome') {
      await ctx.answerCbQuery().catch(() => {});
      const user = await userService.getByTelegram(ctx.from.id);
      return showWelcome(ctx, user);
    }

    if (PENDING[data]) {
      await ctx.answerCbQuery().catch(() => {});
      try {
        await ctx.editMessageText(
          `🚧 Este módulo será entregue em <b>${PENDING[data]}</b>.\nUse /cancelar para voltar.`,
          { parse_mode: 'HTML' }
        );
      } catch {}
      return;
    }

    await ctx.answerCbQuery().catch(() => {});
  });
};
