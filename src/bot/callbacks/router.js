const userService = require('../../services/userService');
const { showWelcome } = require('../flows/welcome');
const { showCatalog, showProduct } = require('../flows/catalog');

const PENDING = {
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

    const user = await userService.getByTelegram(ctx.from.id);
    if (!user) return ctx.answerCbQuery('Use /start.').catch(() => {});

    if (data === 'nav:welcome') {
      await ctx.answerCbQuery().catch(() => {});
      return showWelcome(ctx, user);
    }

    if (data === 'nav:catalog') {
      await ctx.answerCbQuery().catch(() => {});
      return showCatalog(ctx, user, 0);
    }

    if (data.startsWith('cat:page:')) {
      await ctx.answerCbQuery().catch(() => {});
      const raw = data.slice('cat:page:'.length);
      const page = parseInt(raw, 10);
      if (!Number.isFinite(page)) return;
      return showCatalog(ctx, user, page);
    }

    if (data.startsWith('cat:prod:')) {
      await ctx.answerCbQuery().catch(() => {});
      const id = parseInt(data.slice('cat:prod:'.length), 10);
      if (!Number.isFinite(id)) return;
      return showProduct(ctx, user, id);
    }

    if (data.startsWith('cat:buy:') || data.startsWith('cat:buy_multi:') || data.startsWith('cat:cart:')) {
      await ctx.answerCbQuery().catch(() => {});
      const action = data.startsWith('cat:buy_multi:')
        ? 'Módulo 4 (Compra de várias unidades)'
        : data.startsWith('cat:cart:')
          ? 'Módulo 14 (Carrinho)'
          : 'Módulo 4 (Compra individual)';
      try {
        await ctx.editMessageText(
          `🚧 Este fluxo será entregue em <b>${action}</b>.\nUse /cancelar para voltar.`,
          { parse_mode: 'HTML' }
        );
      } catch {}
      return;
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
