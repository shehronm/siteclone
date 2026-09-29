'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const health = require('../api/health.js');

test('readiness is uncached, fails closed without config, and never calls Telegram', t => {
  const saved = { token: process.env.TELEGRAM_BOT_TOKEN, chat: process.env.TELEGRAM_CHAT_ID };
  t.after(() => {
    for (const [key, value] of [['TELEGRAM_BOT_TOKEN', saved.token], ['TELEGRAM_CHAT_ID', saved.chat]]) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  });
  t.mock.method(globalThis, 'fetch', () => { throw Error('Health must not call external providers'); });
  function request(method) {
    const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; return this; },
      status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; }, end() { this.ended = true; return this; } };
    health({ method }, res);
    assert.equal(res.headers['Cache-Control'], 'no-store');
    return res;
  }
  delete process.env.TELEGRAM_BOT_TOKEN;
  delete process.env.TELEGRAM_CHAT_ID;
  assert.equal(request('GET').code, 503);
  process.env.TELEGRAM_BOT_TOKEN = 'test-secret';
  process.env.TELEGRAM_CHAT_ID = 'test-chat';
  assert.deepEqual(request('GET').body, { ok: true });
  const head = request('HEAD');
  assert.equal(head.code, 200); assert.equal(head.body, undefined); assert(head.ended);
  process.env.TELEGRAM_BOT_TOKEN = 'your_bot_token_from_botfather';
  assert.equal(request('GET').code, 503);
  assert.equal(request('POST').code, 405);
  assert.equal(globalThis.fetch.mock.callCount(), 0);
});
