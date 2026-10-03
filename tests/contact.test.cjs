'use strict';

const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const contact = require('../api/contact.js');

const savedEnvironment = {};
const validBody = () => ({
  name: 'Test visitor',
  email: 'visitor@example.com',
  topic: 'Website or digital product',
  message: 'A local automated test enquiry.',
  website: '',
});

beforeEach(() => {
  for (const key of ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID']) savedEnvironment[key] = process.env[key];
  process.env.TELEGRAM_BOT_TOKEN = '123456789:test-token-for-local-mocks';
  process.env.TELEGRAM_CHAT_ID = '-100123456789';
});

afterEach(() => {
  for (const [key, value] of Object.entries(savedEnvironment)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

async function request(body = validBody(), overrides = {}) {
  const response = {
    statusCode: 200,
    headers: {},
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; return this; },
    json(data) { this.body = data; return this; },
  };
  await contact({ method: 'POST', headers: { 'content-type': 'application/json' }, body, ...overrides }, response);
  assert.equal(response.headers['cache-control'], 'no-store');
  return response;
}

function blockNetwork(t) {
  return t.mock.method(globalThis, 'fetch', async () => { throw new Error('Unexpected outbound request'); });
}

test('malformed JSON from the runtime body getter is a 400 response', async t => {
  blockNetwork(t);
  const req = { method: 'POST', headers: { 'content-type': 'application/json' } };
  Object.defineProperty(req, 'body', { get() { throw new SyntaxError('Invalid JSON'); } });
  const res = {
    status(code) { this.statusCode = code; return this; },
    setHeader() { return this; },
    json(body) { this.body = body; return this; },
  };
  await contact(req, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.ok, false);
});

test('non-POST methods are rejected without notifying the provider', async t => {
  const mock = blockNetwork(t);
  for (const method of ['GET', 'PUT', 'OPTIONS']) {
    const response = await request(validBody(), { method });
    assert.equal(response.statusCode, 405);
    assert.equal(response.headers.allow, 'POST');
    assert.equal(response.body.ok, false);
  }
  assert.equal(mock.mock.callCount(), 0);
});

test('requires JSON and rejects invalid body shapes', async t => {
  const mock = blockNetwork(t);
  for (const headers of [{}, { 'content-type': 'text/plain' }, { 'content-type': 'application/x-www-form-urlencoded' }]) {
    assert.equal((await request(validBody(), { headers })).statusCode, 415);
  }
  for (const body of [null, [], 'not JSON', 1, {}]) {
    assert.equal((await request(body)).statusCode, 400);
  }
  assert.equal(mock.mock.callCount(), 0);
});

test('rejects oversized JSON before delivery, including requests without Content-Length', async t => {
  const mock = blockNetwork(t);
  const advertised = await request(validBody(), { headers: { 'content-type': 'application/json', 'content-length': '16385' } });
  assert.equal(advertised.statusCode, 413);
  assert.equal(advertised.body.ok, false);

  const oversized = await request({ ...validBody(), extra: 'x'.repeat(17_000) });
  assert.equal(oversized.statusCode, 413);

  // UTF-8 byte length matters: a short JSON string can still exceed 16 KiB.
  const multibyte = await request({ ...validBody(), extra: '🟢'.repeat(4_100) });
  assert.equal(multibyte.statusCode, 413);
  assert.equal(mock.mock.callCount(), 0);
});

test('oversized Content-Length is rejected before reading the body getter', async t => {
  blockNetwork(t);
  const req = { method: 'POST', headers: { 'content-type': 'application/json', 'content-length': '99999' } };
  Object.defineProperty(req, 'body', { get() { throw new Error('Body should not be read'); } });
  const res = {
    status(code) { this.statusCode = code; return this; },
    setHeader() { return this; },
    json(body) { this.body = body; return this; },
  };
  await contact(req, res);
  assert.equal(res.statusCode, 413);
});

test('server validates field types, lengths, email, topic and whitespace', async t => {
  const mock = blockNetwork(t);
  const invalid = [
    { name: 'A' }, { name: '   ' }, { name: 'A'.repeat(101) }, { name: 'Name\nInjected line' }, { name: 42 },
    { email: 'invalid' }, { email: 'a@@example.com' }, { email: 'test@example.com\nInjected' }, { email: 'a'.repeat(255) }, { email: [] },
    { topic: 'Unknown topic' }, { topic: null },
    { message: 'short' }, { message: '          ' }, { message: 'x'.repeat(2001) }, { message: {} },
  ];
  for (const fields of invalid) {
    const response = await request({ ...validBody(), ...fields });
    assert.equal(response.statusCode, 400, JSON.stringify(fields));
    assert.equal(response.body.ok, false);
  }
  assert.equal(mock.mock.callCount(), 0);
});

test('honeypot acknowledges without sending or requiring credentials', async t => {
  const mock = blockNetwork(t);
  delete process.env.TELEGRAM_BOT_TOKEN;
  const response = await request({ ...validBody(), website: 'https://spam.example' });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.ok, true);
  assert.equal(mock.mock.callCount(), 0);
});

test('missing, blank and template credentials return 503, never a false success', async t => {
  const mock = blockNetwork(t);
  for (const token of ['', '   ', 'your_bot_token_from_botfather']) {
    process.env.TELEGRAM_BOT_TOKEN = token;
    const response = await request();
    assert.equal(response.statusCode, 503);
    assert.equal(response.body.ok, false);
  }
  process.env.TELEGRAM_BOT_TOKEN = '123:test-token';
  for (const chat of ['', '   ', 'your_numeric_chat_id']) {
    process.env.TELEGRAM_CHAT_ID = chat;
    assert.equal((await request()).statusCode, 503);
  }
  assert.equal(mock.mock.callCount(), 0);
});

test('successful provider acknowledgement yields the explicit JSON success contract', async t => {
  const mock = t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://api.telegram.org/bot123456789:test-token-for-local-mocks/sendMessage');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers['Content-Type'], 'application/json');
    assert.ok(options.signal instanceof AbortSignal);
    const payload = JSON.parse(options.body);
    assert.equal(payload.chat_id, '-100123456789');
    assert.equal(payload.link_preview_options.is_disabled, true);
    assert.equal(payload.parse_mode, undefined, 'user content is plain text');
    assert.equal(payload.text, 'Новая заявка · MIRWINK\nИмя: Test visitor\nEmail: visitor@example.com\nПроект: Website or digital product\n\nA local automated test enquiry.');
    return { ok: true, status: 200, json: async () => ({ ok: true, result: { message_id: 1 } }) };
  });
  const response = await request({ ...validBody(), name: '  Test visitor ', email: ' visitor@example.com ', message: ' A local automated test enquiry. ' }, { headers: { 'content-type': 'application/json; charset=utf-8' } });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, { ok: true, message: 'Sent' });
  assert.equal(mock.mock.callCount(), 1);
});

test('all existing topic values and the maximum allowed field lengths are accepted', async t => {
  t.mock.method(globalThis, 'fetch', async () => ({ ok: true, status: 200, json: async () => ({ ok: true }) }));
  for (const topic of ['Website or digital product', 'AI or automation', 'CRM or integration', 'Telegram service', 'Internal system', 'Let’s define it together']) {
    assert.equal((await request({ ...validBody(), topic })).statusCode, 200);
  }
  assert.equal((await request({ ...validBody(), name: 'N'.repeat(100), message: 'M'.repeat(2000) })).statusCode, 200);
});

test('HTTP error, ok:false, null and invalid provider JSON never produce success', async t => {
  t.mock.method(console, 'error', () => {});
  const responses = [
    { ok: false, status: 403, json: async () => ({ ok: false, error_code: 403 }) },
    { ok: true, status: 200, json: async () => ({ ok: false, error_code: 400 }) },
    { ok: true, status: 200, json: async () => null },
    { ok: true, status: 200, json: async () => ({}) },
    { ok: true, status: 200, json: async () => { throw new SyntaxError('Unexpected response'); } },
  ];
  t.mock.method(globalThis, 'fetch', async () => responses.shift());
  while (responses.length) {
    const response = await request();
    assert.equal(response.statusCode, 502);
    assert.equal(response.body.ok, false);
  }
});

test('network failures and timeouts return retryable failure without exposing secrets', async t => {
  const log = t.mock.method(console, 'error', () => {});
  let errorName = 'TypeError';
  t.mock.method(globalThis, 'fetch', async () => {
    const error = new Error('Do not expose token or request data');
    error.name = errorName;
    throw error;
  });
  for (errorName of ['TypeError', 'TimeoutError', 'AbortError']) {
    const response = await request();
    assert.equal(response.statusCode, 502);
    assert.deepEqual(response.body, { ok: false, message: 'Message could not be delivered' });
  }
  assert.ok(log.mock.calls.every(call => !call.arguments.join(' ').includes('Do not expose')));
});

test('delivery log records outcome without request data or provider credentials', async t => {
  const info = t.mock.method(console, 'info', () => {});
  const error = t.mock.method(console, 'error', () => {});
  t.mock.method(globalThis, 'fetch', async () => ({ ok: true, status: 200, json: async () => ({ ok: true }) }));

  const fields = { ...validBody(), name: 'Private Name', email: 'private@example.com', message: 'Private message contents' };
  assert.equal((await request(fields)).statusCode, 200);
  assert.equal(info.mock.callCount(), 1);
  assert.deepEqual(JSON.parse(info.mock.calls[0].arguments[0]), { event: 'contact.delivery', outcome: 'sent' });

  delete process.env.TELEGRAM_BOT_TOKEN;
  assert.equal((await request(fields)).statusCode, 503);
  assert.deepEqual(JSON.parse(error.mock.calls[0].arguments[0]), { event: 'contact.delivery', outcome: 'unconfigured' });
  const logs = [...info.mock.calls, ...error.mock.calls].map(call => call.arguments.join(' ')).join(' ');
  for (const secret of ['Private Name', 'private@example.com', 'Private message contents', '123456789:test-token-for-local-mocks', '-100123456789']) {
    assert.equal(logs.includes(secret), false);
  }
});
