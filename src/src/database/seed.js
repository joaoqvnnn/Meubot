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
  {
    key: 'purchase_multi_approved',
    text:
`✅ <b>COMPRA APROVADA!</b>

🛍 Pedido: #{{ORDER_SHORT}}
💎 Serviço: {{PRODUTO}}
📦 Quantidade: {{QTD}} unidades

💰 Valor unitário: R$ {{VALOR_UN}}
💵 Total pago: R$ {{VALOR_TOTAL}}
💳 Saldo anterior: R$ {{SALDO_ANT}}
💰 Saldo restante: R$ {{SALDO_ATUAL}}

📅 Compra: {{DATA}}

👇 <b>Suas contas estão liberadas!</b>`,
    media_url: null,
    buttons: [
      [{ text: '▶️ Ver minhas contas', action: 'view_items' }],
      [{ text: '◀️ Voltar ao catálogo', callback_data: 'nav:catalog' }],
    ],
  },
  {
    key: 'purchase_multi_approved_pix',
    text:
`✅ <b>COMPRA APROVADA!</b>

🛍 Pedido: #{{ORDER_SHORT}}
💎 Serviço: {{PRODUTO}}
📦 Quantidade: {{QTD}} unidades

💰 Valor unitário: R$ {{VALOR_UN}}
💵 Total pago: R$ {{VALOR_TOTAL}}
💳 Saldo utilizado: R$ {{SALDO_UTILIZADO}}
⚡ PIX pago: R$ {{VALOR_PIX}}

📅 Compra: {{DATA}}

👇 <b>Suas contas estão liberadas!</b>`,
    media_url: null,
    buttons: [
      [{ text: '▶️ Ver minhas contas', action: 'view_items' }],
      [{ text: '◀️ Voltar ao catálogo', callback_data: 'nav:catalog' }],
    ],
  },
  {
    key: 'delivery_item',
    text:
`✅ <b>COMPRA LIBERADA!</b> [{{POS}}/{{TOTAL}}]

🛍 Pedido: #{{ORDER_SHORT}}
💎 Serviço: {{PRODUTO}}
⏰ Compra: {{DATA}}
📆 Válido até: {{VENC}}
💰 Valor: R$ {{VALOR}}
🎫 ID: {{ID}}

📧 Email: {{EMAIL}}
🔐 Senha: {{SENHA}}

Ref: {{REF}}`,
    media_url: null,
    buttons: [],
  },
  {
    key: 'profile_panel',
    text:
`👤 <b>MEU PERFIL</b>

🔍 Detalhes da sua conta:

👤 <b>INFORMAÇÕES</b>
🆔 ID da Carteira: {{ID_CARTEIRA}}
💰 Saldo Atual: R$ {{SALDO}}
📲 Seu WhatsApp: {{WHATSAPP}}

─── 📊 <b>SUAS MOVIMENTAÇÕES</b>
🛒 Compras Realizadas: {{QTD_COMPRAS}}
💰 Total Gasto: R$ {{TOTAL_GASTO}}
💠 Pix Inseridos: R$ {{PIX_INSERIDO}}
🎁 Gifts Resgatados: {{GIFTS}}`,
    media_url: null,
    buttons: [
      [{ text: '🛍 Histórico de Compras', callback_data: 'prof:history:0:all' }],
      [{ text: '🎁 Resgatar Gift Card', callback_data: 'prof:gift' }],
      [{ text: '✏️ Alterar Dados', callback_data: 'prof:change' }],
      [{ text: '◀️ Voltar', callback_data: 'nav:welcome' }],
    ],
  },
  {
    key: 'profile_history',
    text:
`🛍 <b>HISTÓRICO</b> — Compra {{ATUAL}}/{{TOTAL}}

⏰ Data: {{DATA_COMPRA}}
📆 Vence: {{DATA_VENC}}
💰 Valor: R$ {{VALOR}}
🎫 ID: {{ID_COMPRA}}
⚜️ Serviço: {{SERVICO}}
📧 Email: {{EMAIL}}
🔐 Senha: {{SENHA}}
📃 Nota: {{NOTA}}

Ref: {{REF}}`,
    media_url: null,
    buttons: [],
  },
  {
    key: 'profile_no_purchases',
    text:
`Você não tem compras no bot.

Quando comprar alguma conta, as informações dela ficarão exibidas aqui.`,
    media_url: null,
    buttons: [
      [{ text: '🛍️ Ver Catálogo', callback_data: 'nav:catalog' }],
      [{ text: '◀️ Voltar', callback_data: 'nav:profile' }],
    ],
  },
  {
    key: 'profile_no_active',
    text:
`Você não tem compras ativas (não vencidas) no bot.

Use o botão abaixo para ver todas as compras.`,
    media_url: null,
    buttons: [
      [{ text: '📋 Ver todas', callback_data: 'prof:history:0:all' }],
      [{ text: '◀️ Voltar', callback_data: 'nav:profile' }],
    ],
  },
  {
    key: 'profile_gift_prompt',
    text:
`🎁 <b>RESGATAR GIFT CARD</b>

Digite o código do seu gift card abaixo:

Exemplo: {{EXEMPLO_GIFT}}

💡 Dica: Código tem {{QTD_CHARS}} caracteres.

✖️ /cancelar para voltar.`,
    media_url: null,
    buttons: [],
  },
  {
    key: 'profile_gift_invalid',
    text:
`❌ <b>GIFT INVÁLIDO</b>

O código <b>{{CODIGO}}</b> não existe ou já foi usado.

🔍 Verifique se digitou certo e tente novamente.

Exemplo correto: {{EXEMPLO_GIFT}}`,
    media_url: null,
    buttons: [],
  },
  {
    key: 'profile_gift_success',
    text:
`✅ <b>GIFT RESGATADO COM SUCESSO!</b>

🎁 Código: {{CODIGO_GIFT}}
💰 Valor adicionado: R$ {{VALOR_GIFT}}

💳 Seu novo saldo: R$ {{SALDO_ATUAL}}

─── 📍 <b>ONDE USAR</b> ───

Seu saldo já está na carteira e pode ser usado em:`,
    media_url: null,
    buttons: [],
  },
];
