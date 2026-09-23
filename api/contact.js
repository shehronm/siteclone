const TOPICS = new Set([
  'Website or digital product',
  'AI or automation',
  'CRM or integration',
  'Telegram service',
  'Internal system',
  'Let’s define it together',
]);

function reply(res, status, message) {
  res.status(status).setHeader('Cache-Control', 'no-store').json({ message });
}

module.exports = async function contact(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return reply(res, 405, 'Method not allowed');
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return reply(res, 503, 'Notifications are not configured');

  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return reply(res, 400, 'Invalid request');
  }
  // Hidden field: automated form fillers often populate this field.
  if (body.website) return reply(res, 200, 'OK');

  const { name, email, topic, message } = body;
  if (
    typeof name !== 'string' || name.trim().length < 2 || name.length > 100 ||
    typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    typeof topic !== 'string' || !TOPICS.has(topic) ||
    typeof message !== 'string' || message.trim().length < 10 || message.length > 2000
  ) return reply(res, 400, 'Please check the form fields');

  const text = [
    'Новая заявка · MIRO DIGITAL',
    `Имя: ${name.trim()}`,
    `Email: ${email.trim()}`,
    `Проект: ${topic}`,
    '',
    message.trim(),
  ].join('\n');

  try {
    const result = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(10000),
    });
    // Telegram may return HTTP 200 with ok:false; both cases mean no delivery.
    const payload = await result.json();
    if (!result.ok || payload.ok !== true) {
      console.error('Contact notification failed', result.status, payload.error_code);
      return reply(res, 502, 'Message could not be delivered');
    }
    return reply(res, 200, 'Sent');
  } catch (error) {
    console.error('Contact notification unavailable', error.name);
    return reply(res, 502, 'Message could not be delivered');
  }
};
