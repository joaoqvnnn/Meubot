require('dotenv').config();

const required = ['BOT_TOKEN', 'DATABASE_URL', 'CHANNEL_ID', 'CHANNEL_LINK'];
for (const key of required) {
  if (!process.env[key]) console.warn(`[ENV] Variável ${key} não definida`);
}

module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  DATABASE_URL: process.env.DATABASE_URL,
  CHANNEL_ID: process.env.CHANNEL_ID,
  CHANNEL_LINK: process.env.CHANNEL_LINK,
  MERCADOPAGO_ACCESS_TOKEN: process.env.MERCADOPAGO_ACCESS_TOKEN,
  PORT: parseInt(process.env.PORT || '3000', 10),
  WEBHOOK_URL: process.env.WEBHOOK_URL,
  NODE_ENV: process.env.NODE_ENV || 'development',
};
