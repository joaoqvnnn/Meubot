const { pool } = require('./connection');

const templates = [
  {
    key: 'channel_block',
    text: `🔓 <b>Seu acesso está quase pronto!</b>\n\nEntre no nosso grupo para ativar o serviço e receber todas as atualizações.`,
    media_url: null,
    buttons: [[{ text: '📢 Entrar no canal', url: 'https://t.me/seu_canal' }]],
  },
  {
    key: 'welcome',
    text:
`🎬 <b>Bem-vindo à Larizinha Store!</b> ✨
A sua central de streamings com entrega <b>100% automática</b>.

Pagou, recebeu. Sem filas, sem precisar falar com atendente, 24 horas por dia! ⚡️

🔐 <b>Segurança e Suporte:</b>
Mais de {{TOTAL_CLIENTES}} clientes já passaram por aqui.
Participe da nossa comunidade e veja as referências.

💠 <b>Seus Dados:</b>
├ 👤 ID: {{USER_ID}}
└ 💰 Saldo Atual: R$ {{SALDO}}

👉 <b>COMO COMEÇAR:</b>
Clique no botão "🛍️ Comprar Produtos" abaixo para ver nosso catálogo e escolher sua tela!`,
    media_url: null,
    buttons: [
      [{ text: '🛍️ Comprar Produto', callback_data: 'nav:catalog' }],
      [{ text: '👤 Meu Perfil', callback_data: 'nav:profile' }],
      [{ text: '💳 Recarregar Saldo', callback_data: 'nav:recharge' }],
      [{ text: '💰 Renda Extra', callback_data: 'nav:affiliate' }],
      [{ text: '🏆 Top Compradores', callback_data: 'nav:rankings' }],
      [{ text: '💬 Atendimento', url: 'https://t.me/seu_atendimento' }],
      [{ text: '🛒 Abrir Loja', url: 'https://sualoja.com' }],
      [{ text: '🛍️ Carrinho', callback_data: 'nav:cart' }],
    ],
  },
  {
    key: 'catalog_header',
    text:
`📱 <b>CATÁLOGO DE SERVIÇOS</b>
━━━━━━━━━━━━━━━━━━━

💰 Saldo: R$ {{SALDO}}
📦 Produtos disponíveis: {{TOTAL_PRODUTOS}}

⬇️ Selecione um produto para ver os planos:`,
    media_url: null,
    buttons: [
      [{ text: '◀️ Voltar', callback_data: 'nav:welcome' }],
      [{ text: '◀️ Anterior', callback_data: 'cat:page:prev' }, { text: 'Próxima ▶️', callback_data: 'cat:page:next' }],
    ],
  },
  {
    key: 'product_detail',
    text:
`🚀 <b>{{NOME_PRODUTO}}</b>

💰 Valor: R$ {{VALOR}}
👛 Seu saldo: R$ {{CARTEIRA}}
📦 Estoque: {{QUANTIDADE}} unidades

📝 <b>Descrição:</b>
{{DESCRICAO}}

📊 <b>Informações:</b>
├ {{VENDIDOS}} vendas
└ {{ONLINE}} pessoas vendo agora

🛡️ Garantia: {{DIAS}} dias
✅ Compra segura - /termos`,
    media_url: null,
    buttons: [
      [{ text: '🛒 Comprar', action: 'buy' }],
      [{ text: '🛒 Comprar mais de um', action: 'buy_multi' }],
      [{ text: '🛍️ Adicionar no carrinho', action: 'cart_add' }],
      [{ text: '◀️ Voltar ao catálogo', action: 'back_catalog' }],
    ],
  },
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const t of templates) {
      await client.query(
        `INSERT INTO message_templates (key, text, media_url, buttons_json, enabled)
         VALUES ($1, $2, $3, $4, TRUE)
         ON CONFLICT (key) DO NOTHING`,
        [t.key, t.text, t.media_url, JSON.stringify(t.buttons)]
      );
    }
    await client.query('COMMIT');
    console.log('[seed] concluído');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[seed] erro', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}
seed();
