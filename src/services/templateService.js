const { query } = require('../database/connection');
const { Markup } = require('telegraf');

async function getTemplate(key) {
  const r = await query(
    `SELECT * FROM message_templates WHERE key = $1 AND enabled = TRUE`,
    [key]
  );
  return r.rows[0] || null;
}

function renderVars(text, vars = {}) {
  if (!text) return '';
  return text
    .replace(/\{\{\s*([A-Z0-9_]+)\s*\}\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m))
    .replace(/\{\s*([A-Za-z0-9_]+)\s*\}/g, (m, k) => {
      const KEY = k.toUpperCase();
      return vars[KEY] != null ? String(vars[KEY]) : m;
    });
}

function buildInlineKeyboard(rows, vars = {}) {
  if (!Array.isArray(rows) || rows.length === 0) return {};
  const built = rows.map(row =>
    row.map(btn => {
      const text = renderVars(btn.text, vars);
      if (btn.url) return Markup.button.url(text, renderVars(btn.url, vars));
      return Markup.button.callback(text, btn.callback_data || 'noop');
    })
  );
  return Markup.inlineKeyboard(built);
}

module.exports = { getTemplate, renderVars, buildInlineKeyboard };
