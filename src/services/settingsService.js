const { query } = require('../database/connection');

async function getSetting(key, fallback = null) {
  const r = await query(`SELECT value FROM settings WHERE key = $1`, [key]);
  return r.rows[0]?.value ?? fallback;
}

async function setSetting(key, value) {
  await query(
    `INSERT INTO settings (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [key, String(value)]
  );
}

async function getStoreStats() {
  const r = await query(`SELECT COUNT(*)::int AS n FROM users`);
  return { total_clients: r.rows[0].n };
}

module.exports = { getSetting, setSetting, getStoreStats };
