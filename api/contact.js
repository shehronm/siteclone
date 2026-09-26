const TOPICS = new Set([
  'Website or digital product',
  'AI or automation',
  'CRM or integration',
  'Telegram service',
  'Internal system',
  'Let’s define it together',
]);

function reply(res, status, message) {
  // An explicit JSON acknowledgement prevents a static-host fallback page from
  // being mistaken for a delivered enquiry by the browser.
  return res.status(status).setHeader('Cache-Control', 'no-store').json({
    ok: status >= 200 && status < 300,
    message,
  });
}

module.exports = async function contact(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return reply(res, 405, 'Method not allowed');
  }

  if (!/^application\/json(?:\s*;|$)/i.test(req.headers?.['content-type'] || '')) {
    return reply(res, 415, 'Content-Type must be application/json');
  }

  let body;
  try {
    // Vercel parses JSON lazily; malformed JSON can throw from this getter.
    body = req.body;
  } catch {
    return reply(res, 400, 'Invalid JSON');
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return reply(res, 400, 'Invalid request');
  }
  // Hidden field: automated form fillers often populate this field.
  if (body.website) return reply(res, 200, 'OK');

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const { topic } = body;
  if (
    name.length < 2 || name.length > 100 || /[\r\n\x00-\x1f\x7f]/.test(name) ||
    email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    typeof topic !== 'string' || !TOPICS.has(topic) ||
    message.length < 10 || message.length > 2000
  ) return reply(res, 400, 'Please check the form fields');

  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId || token === 'your_bot_token_from_botfather' || chatId === 'your_numeric_chat_id') {
    return reply(res, 503, 'Notifications are not configured');
  }

  const text = [
    'Новая заявка · MIRO DIGITAL',
    `Имя: ${name}`,
    `Email: ${email}`,
    `Проект: ${topic}`,
    '',
    message,
  ].join('\n');

  try {
    const result = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, link_preview_options: { is_disabled: true } }),
      signal: AbortSignal.timeout(10000),
    });
    // Telegram may return HTTP 200 with ok:false; both cases mean no delivery.
    const payload = await result.json();
    if (!result.ok || payload?.ok !== true) {
      console.error('Contact notification failed', result.status, payload?.error_code);
      return reply(res, 502, 'Message could not be delivered');
    }
    return reply(res, 200, 'Sent');
  } catch (error) {
    // Never log request content or an error message containing the bot URL/token.
    console.error('Contact notification unavailable', error?.name || 'Error');
    return reply(res, 502, 'Message could not be delivered');
  }
};
