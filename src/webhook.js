const express = require('express');
const env = require('./config/env');
const paymentService = require('./services/paymentService');
const purchaseService = require('./services/purchaseService');
const userService = require('./services/userService');
const { query } = require('./database/connection');
const delivery = require('./bot/flows/delivery');

function createWebhook(bot) {
  const app = express();
  app.use(express.json());

  app.post('/webhook/mercadopago', async (req, res) => {
    try {
      const body = req.body;
      let mpPaymentId = null;
      if (body?.data?.id) mpPaymentId = String(body.data.id);
      else if (body?.id) mpPaymentId = String(body.id);
      if (!mpPaymentId) return res.sendStatus(200);

      const r = await query(`SELECT * FROM payments WHERE mp_payment_id = $1`, [mpPaymentId]);
      const payment = r.rows[0];
      if (!payment) return res.sendStatus(200);

      const refreshed = await paymentService.refreshFromProvider(payment.id);
      if (!refreshed || refreshed.status !== 'approved') return res.sendStatus(200);

      if (refreshed.kind === 'purchase' && refreshed.purchase_id) {
        let resApprove;
        try {
          resApprove = await purchaseService.approvePixPurchase({
            purchaseId: refreshed.purchase_id,
            paymentId: refreshed.id,
            pixAmount: refreshed.amount,
          });
        } catch (err) {
          console.error('[webhook] approve', err.message);
          return res.sendStatus(200);
        }
        if (resApprove.already) return res.sendStatus(200);

        const purchase = await purchaseService.getPurchaseById(refreshed.purchase_id);
        if (purchase?.pix_chat_id && purchase?.pix_message_id) {
          const fakeCtx = {
            updateType: 'callback_query',
            callbackQuery: { message: { message_id: purchase.pix_message_id } },
            from: { id: refreshed.user_id },
            answerCbQuery: () => Promise.resolve(),
            editMessageText: (text, extra) =>
              bot.telegram.editMessageText(purchase.pix_chat_id, purchase.pix_message_id, undefined, text, extra),
          };
          const user = await userService.getByTelegram(refreshed.user_id);
          try {
            await delivery.startDelivery(fakeCtx, user, {
              purchaseId: refreshed.purchase_id,
              balanceBefore: resApprove.balanceBefore,
              balanceAfter: resApprove.balanceAfter,
              pixUsed: resApprove.pixUsed,
              balanceUsed: resApprove.balanceUsed,
            }, 'pix');
          } catch (err) {
            console.error('[webhook] delivery', err.message);
          }
        }
      }

      return res.sendStatus(200);
    } catch (err) {
      console.error('[webhook] erro', err);
      return res.sendStatus(500);
    }
  });

  app.get('/health', (_req, res) => res.json({ ok: true }));

  return app;
}

module.exports = { createWebhook };
