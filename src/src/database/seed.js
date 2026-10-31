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
  {
    key: 'purchase_insufficient',
    text:
`⚠️ <b>SALDO INSUFICIENTE</b>

💳 Você tem: R$ {{SALDO}}
🛒 Produto: R$ {{VALOR}}
💸 Falta apenas: R$ {{FALTA}}

Deseja gerar um PIX de R$ {{FALTA}} para liberar na hora?`,
    media_url: null,
    buttons: [
      [{ text: '⚡ Gerar PIX de R$ {{FALTA}}', action: 'gen_pix' }],
      [{ text: '❌ Cancelar', callback_data: 'nav:welcome' }],
    ],
  },
  {
    key: 'purchase_pix_creating',
    text:
`⚡ <b>Criando seu pagamento…</b>

🔐 Gerando PIX seguro no valor de R$ {{VALOR}}`,
    media_url: null,
    buttons: [],
  },
  {
    key: 'purchase_pix_created',
    text:
`💳 <b>PIX CRIADO COM SUCESSO!</b>

⌛ Validade: {{MINUTOS}} minutos
💲 Para pagar: R$ {{VALOR}}
🔑 Código: {{ID}}

⚠️ <b>IMPORTANTE:</b> Esse PIX só pode ser pago 1x. Se pagar 2 vezes, o segundo não entra.

🔗 <b>PIX COPIA E COLA:</b>
<code>{{CODIGO_PIX}}</code>

👆 Toque no código para copiar.

💼 <b>SEU EXTRATO:</b>
• Saldo utilizado na compra: R$ {{SALDO_RESERVADO}}
• PIX necessário: R$ {{VALOR_PIX}}
• Total disponível para a compra: R$ {{TOTAL_DISPONIVEL}}

✅ Pagou? Sua compra será liberada automaticamente!`,
    media_url: null,
    buttons: [
      [{ text: '🔄 Aguardando pagamento', action: 'check_pix' }],
      [{ text: '📋 Copiar PIX', action: 'copy_pix' }],
    ],
  },
  {
    key: 'purchase_approved_balance',
    text:
`✅ <b>COMPRA APROVADA!</b>

🛍 Seu pedido: #{{ORDER_SHORT}}
🎫 ID: {{PURCHASE_ID}}

📦 Produto: {{PRODUTO}}
💵 Valor pago: R$ {{VALOR}}
💳 Saldo anterior: R$ {{SALDO_ANT}}
💰 Saldo restante: R$ {{SALDO_ATUAL}}
📅 Compra: {{DATA}}
⏳ Válido até: {{VENC}}

📧 Email: {{EMAIL}}
🔐 Senha: {{SENHA}}

📝 <b>Como usar:</b>
{{NOTA}}

👇 <b>CLIQUE NO BOTÃO ABAIXO PARA ATIVAR</b>`,
    media_url: null,
    buttons: [
      [{ text: '👁️ Ativar', action: 'toggle_cred' }],
      [{ text: '🌐 Ir para o site', action: 'site' }],
      [{ text: '◀️ Voltar ao catálogo', callback_data: 'nav:catalog' }],
    ],
  },
  {
    key: 'purchase_approved_pix',
    text:
`✅ <b>COMPRA APROVADA!</b>

🛍 Seu pedido: #{{ORDER_SHORT}}
🎫 ID: {{PURCHASE_ID}}

📦 Produto: {{PRODUTO}}
💵 Valor total do produto: R$ {{VALOR}}
💳 Saldo utilizado: R$ {{SALDO_UTILIZADO}}
⚡ PIX pago: R$ {{VALOR_PIX}}
📅 Compra: {{DATA}}
⏳ Válido até: {{VENC}}

📧 Email: {{EMAIL}}
🔐 Senha: {{SENHA}}

📝 <b>Como usar:</b>
{{NOTA}}

👇 <b>CLIQUE NO BOTÃO ABAIXO PARA ATIVAR</b>`,
    media_url: null,
    buttons: [
      [{ text: '👁️ Ativar', action: 'toggle_cred' }],
      [{ text: '🌐 Ir para o site', action: 'site' }],
      [{ text: '◀️ Voltar ao catálogo', callback_data: 'nav:catalog' }],
    ],
  },
  {
    key: 'purchase_pix_expired',
    text:
`⌛️ <b>PAGAMENTO PIX EXPIRADO</b>

⚠️ O tempo limite para realizar este pagamento foi excedido.

🆔 Referência do Pagamento: {{PAYMENT_ID}}
💸 Valor Solicitado: R$ {{VALOR}}

❌ Este PIX não é mais válido e não será compensado se pagar.

👉 Gere um novo PIX abaixo para concluir sua operação:`,
    media_url: null,
    buttons: [
      [{ text: '⚡ Gerar novo PIX', action: 'new_pix' }],
      [{ text: '◀️ Voltar ao menu', callback_data: 'nav:welcome' }],
    ],
  },
];
