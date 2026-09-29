'use strict';

// Readiness only: no Telegram message, external request, or secret in the response.
module.exports = function health(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({ ok: false });
  }
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  const ready = !!token && !!chatId && token !== 'your_bot_token_from_botfather' && chatId !== 'your_numeric_chat_id';
  res.status(ready ? 200 : 503);
  if (req.method === 'HEAD') return res.end();
  return res.json({ ok: ready });
};
