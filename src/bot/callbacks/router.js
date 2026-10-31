const userService = require('../../services/userService');
const { showWelcome } = require('../flows/welcome');
const { showCatalog, showProduct } = require('../flows/catalog');
const purchaseFlow = require('../flows/purchase');

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
      const page = parseInt(data.slice('cat:page:'.length), 10);
      if (!Number.isFinite(page)) return;
      return showCatalog(ctx, user, page);
    }

    if (data.startsWith('cat:prod:')) {
      await ctx.answerCbQuery().catch(() => {});
      const id = parseInt(data.slice('cat:prod:'.length), 10);
      if (!Number.isFinite(id)) return;
      return showProduct(ctx, user, id);
    }

    if (data.startsWith('cat:buy:')) {
      await ctx.answerCbQuery().catch(() => {});
      const id = parseInt(data.slice('cat:buy:'.length), 10);
      if (!Number.isFinite(id)) return;
      return purchaseFlow.startPurchase(ctx, user, id);
    }

    if (data.startsWith('cat:buy_multi:')) {
      await ctx.answerCbQuery().catch(() => {});
      try {
        await ctx.editMessageText(
          '🚧 Este fluxo será entregue em <b>Módulo 4 (Compra de várias unidades)</b>.\nUse /cancelar para voltar.',
          { parse_mode: 'HTML' }
        );
      } catch {}
      return;
    }

    if (data.startsWith('cat:cart:')) {
      await ctx.answerCbQuery().catch(() => {});
      try {
        await ctx.editMessageText(
          '🚧 Este fluxo será entregue em <b>Módulo 14 (Carrinho)</b>.\nUse /cancelar para voltar.',
          { parse_mode: 'HTML' }
        );
      } catch {}
      return;
    }

    if (data.startsWith('p:genpix:')) {
      const rest = data.slice('p:genpix:'.length);
      const [pidStr, qStr] = rest.split(':');
      const pid = parseInt(pidStr, 10);
      const q = parseInt(qStr, 10) || 1;
      if (!Number.isFinite(pid)) return;
      await ctx.answerCbQuery().catch(() => {});
      return purchaseFlow.generatePix(ctx, user, pid, q);
    }

    if (data.startsWith('p:check:')) {
      const pid = parseInt(data.slice('p:check:'.length), 10);
      if (!Number.isFinite(pid)) return;
      return purchaseFlow.checkPix(ctx, pid);
    }

    if (data.startsWith('p:cred:')) {
      const rest = data.slice('p:cred:'.length);
      const [purchaseStr, mode] = rest.split(':');
      const purchaseId = parseInt(purchaseStr, 10);
      if (!Number.isFinite(purchaseId)) return;
      return purchaseFlow.toggleCredentials(ctx, purchaseId, mode === 'show');
    }

    if (data.startsWith('p:newpix:')) {
      const pid = parseInt(data.slice('p:newpix:'.length), 10);
      if (!Number.isFinite(pid)) return;
      return purchaseFlow.regeneratePix(ctx, pid);
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
(adicionar as rotas)
CREATE TABLE IF NOT EXISTS gift_cards (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  value NUMERIC(12,2) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  used_by BIGINT,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gift_cards_used_by ON gift_cards (used_by);

CREATE TABLE IF NOT EXISTS gift_card_products (
  gift_card_id BIGINT NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (gift_card_id, product_id)
);

INSERT INTO settings (key, value) VALUES
  ('gift_code_example', 'ABC123XYZ456'),
  ('gift_code_length', '12')
ON CONFLICT (key) DO NOTHING;

(adicionar/atualizar rotas de perfil)
const profile = require('../flows/profile');
const giftCard = require('../flows/giftCard');

// dentro do handler:

if (data === 'nav:profile') {
  await ctx.answerCbQuery().catch(() => {});
  return profile.showProfile(ctx, user);
}

if (data.startsWith('prof:history:')) {
  const parts = data.slice('prof:history:'.length).split(':');
  const page = parseInt(parts[0], 10) || 0;
  const filter = parts[1] || 'all';
  return profile.showHistory(ctx, user, page, filter);
}

if (data === 'prof:gift') {
  return giftCard.askGift(ctx, user);
}

if (data === 'prof:change') {
  await ctx.answerCbQuery().catch(() => {});
  try {
    await ctx.editMessageText(
      '🚧 Este fluxo será entregue em <b>Módulo 6 (Alterar Dados)</b>.\nUse /cancelar para voltar.',
      { parse_mode: 'HTML' }
    );
  } catch {}
  return;
}
