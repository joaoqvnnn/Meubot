const templateService = require('../../services/templateService');
const catalogService = require('../../services/catalogService');
const userService = require('../../services/userService');
const { formatMoney } = require('../../utils/format');
const { Markup } = require('telegraf');

async function renderCatalogHeader(user) {
  const template = await templateService.getTemplate('catalog_header');
  if (!template) return null;
  const total = await catalogService.countActive();
  const vars = {
    SALDO: formatMoney(user.balance),
    TOTAL_PRODUTOS: String(total),
  };
  return {
    template,
    text: templateService.renderVars(template.text, vars),
    vars,
  };
}

async function showCatalog(ctx, user, page = 0) {
  const header = await renderCatalogHeader(user);
  if (!header) return;
  const { template, text, vars } = header;

  const pageSize = await catalogService.getPageSize();
  const total = await catalogService.countActive();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.max(0, Math.min(page, totalPages - 1));

  const products = await catalogService.listActive(pageSize, safePage * pageSize);

  const rows = [];
  for (const p of products) {
    const label = `${p.name} — R$ ${formatMoney(p.price)}`;
    rows.push([Markup.button.callback(label, `cat:prod:${p.id}`)]);
  }

  if (Array.isArray(template.buttons_json) && template.buttons_json.length) {
    const footer = template.buttons_json.map(row =>
      row.map(btn => {
        if (btn.callback_data === 'cat:page:prev' && safePage === 0) return null;
        if (btn.callback_data === 'cat:page:next' && safePage >= totalPages - 1) return null;
        if (btn.callback_data === 'cat:page:prev') {
          return Markup.button.callback(templateService.renderVars(btn.text, vars), `cat:page:${safePage - 1}`);
        }
        if (btn.callback_data === 'cat:page:next') {
          return Markup.button.callback(templateService.renderVars(btn.text, vars), `cat:page:${safePage + 1}`);
        }
        return Markup.button.callback(templateService.renderVars(btn.text, vars), btn.callback_data);
      }).filter(Boolean)
    ).filter(row => row.length > 0);
    rows.push(...footer);
  }

  const extra = {
    parse_mode: 'HTML',
    ...Markup.inlineKeyboard(rows),
  };

  let sent;
  if (ctx.updateType === 'callback_query') {
    try {
      await ctx.editMessageText(text, extra);
      sent = ctx.callbackQuery.message;
    } catch {
      sent = await ctx.reply(text, extra);
    }
  } else {
    sent = await ctx.reply(text, extra);
  }

  if (sent?.message_id) {
    await userService.setLastBotMessage(user.telegram_id, sent.message_id);
  }
}

async function showProduct(ctx, user, productId) {
  const product = await catalogService.getById(productId);
  if (!product || !product.active || !product.visible) {
    await ctx.answerCbQuery('Produto indisponível.').catch(() => {});
    return;
  }

  await catalogService.trackView(user.telegram_id, productId);

  const template = await templateService.getTemplate('product_detail');
  if (!template) return;

  const vendidos = await catalogService.getSalesCount(productId);
  const online = await catalogService.countOnline(productId);

  const vars = {
    NOME_PRODUTO: product.name,
    VALOR: formatMoney(product.price),
    CARTEIRA: formatMoney(user.balance),
    QUANTIDADE: String(product.stock),
    DESCRICAO: product.description || '—',
    VENDIDOS: String(vendidos),
    ONLINE: String(online),
    DIAS: String(product.warranty_days),
  };

  const text = templateService.renderVars(template.text, vars);

  const actionToCallback = {
    buy: `cat:buy:${product.id}`,
    buy_multi: `cat:buy_multi:${product.id}`,
    cart_add: `cat:cart:${product.id}`,
    back_catalog: 'nav:catalog',
  };

  const rows = (template.buttons_json || []).map(row =>
    row.map(btn => {
      const cb = btn.callback_data || actionToCallback[btn.action] || 'noop';
      return Markup.button.callback(templateService.renderVars(btn.text, vars), cb);
    })
  );

  const extra = { parse_mode: 'HTML', ...Markup.inlineKeyboard(rows) };

  let sent;
  if (ctx.updateType === 'callback_query') {
    try {
      await ctx.editMessageText(text, extra);
      sent = ctx.callbackQuery.message;
    } catch {
      sent = await ctx.reply(text, extra);
    }
  } else {
    sent = await ctx.reply(text, extra);
  }

  if (sent?.message_id) {
    await userService.setLastBotMessage(user.telegram_id, sent.message_id);
  }
}

module.exports = { showCatalog, showProduct };
