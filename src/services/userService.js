const { query } = require('../database/connection');

async function findOrCreateByTelegram(ctx) {
  const f = ctx.from;
  const r = await query(
    `INSERT INTO users (telegram_id, username, first_name, last_name)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (telegram_id) DO UPDATE
       SET username = EXCLUDED.username,
           first_name = EXCLUDED.first_name,
           last_name = EXCLUDED.last_name,
           updated_at = NOW()
     RETURNING *`,
    [f.id, f.username, f.first_name, f.last_name]
  );
  return r.rows[0];
}

async function getByTelegram(telegramId) {
  const r = await query(`SELECT * FROM users WHERE telegram_id = $1`, [telegramId]);
  return r.rows[0] || null;
}

async function setChannelVerified(telegramId, verified) {
  await query(
    `UPDATE users SET is_channel_verified = $1, updated_at = NOW() WHERE telegram_id = $2`,
    [verified, telegramId]
  );
}

async function setLastBotMessage(telegramId, messageId) {
  await query(
    `UPDATE users SET last_bot_message_id = $1, updated_at = NOW() WHERE telegram_id = $2`,
    [messageId, telegramId]
  );
}

module.exports = {
  findOrCreateByTelegram,
  getByTelegram,
  setChannelVerified,
  setLastBotMessage,
};
