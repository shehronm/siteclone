'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

const loaded = import(pathToFileURL(path.join(__dirname, '../middleware.js')).href);

async function route(pathname = '/', { country, cookie, agent = 'Mozilla/5.0', method = 'GET', origin = 'https://mirwink.ru' } = {}) {
  const headers = { 'user-agent': agent };
  if (country !== undefined) headers['x-vercel-ip-country'] = country;
  if (cookie !== undefined) headers.cookie = cookie;
  const { default: middleware } = await loaded;
  return middleware(new Request(origin + pathname, { method, headers }));
}

function passed(response) {
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-middleware-next'), '1');
  assert.equal(response.headers.get('location'), null);
}

function privateResponse(response) {
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('cdn-cache-control'), 'no-store');
  assert.equal(response.headers.get('vercel-cdn-cache-control'), 'no-store');
}

test('routing runs only for the two main language entry URLs', async () => {
  const { config } = await loaded;
  assert.deepEqual(config.matcher, ['/', '/ru']);
  assert.equal(config.runtime, 'nodejs');
  for (const pathname of ['/robots.txt', '/sitemap.xml', '/favicon.ico', '/api/contact', '/api/health', '/assets/miro/favicon.svg', '/demos/ember/en.html', '/not-found']) {
    const response = await route(pathname, { country: 'RU', cookie: 'mirwink_lang=ru' });
    passed(response);
    assert.equal(response.headers.get('set-cookie'), null);
  }
});

test('first visits from every configured country use a temporary Russian redirect', async () => {
  for (const country of ['AM', 'AZ', 'BY', 'KZ', 'KG', 'MD', 'RU', 'TJ', 'TM', 'UZ', 'ru']) {
    const response = await route('/', { country });
    assert.equal(response.status, 307, country);
    assert.equal(response.headers.get('location'), '/ru', country);
    assert.equal(response.headers.get('set-cookie'), null, 'automatic choice must not become a manual preference');
    privateResponse(response);
  }
});

test('Europe, other countries and unavailable geolocation retain the English root', async () => {
  for (const country of ['GB', 'DE', 'FR', 'US', 'JP', 'GE', 'UA', 'XX', '', undefined]) {
    const response = await route('/', { country });
    passed(response);
    privateResponse(response);
  }
});

test('manual language query wins over country and prior preferences', async () => {
  const english = await route('/?lang=en', { country: 'RU', cookie: 'mirwink_lang=ru' });
  passed(english);
  privateResponse(english);
  assert.equal(english.headers.get('set-cookie'), 'mirwink_lang=en; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax; Secure');
  const russian = await route('/ru?lang=ru', { country: 'FR', cookie: 'mirwink_lang=en' });
  passed(russian);
  privateResponse(russian);
  assert.match(russian.headers.get('set-cookie'), /^mirwink_lang=ru;/);
});

test('manual choice survives disabled cookies because the explicit URL remains usable', async () => {
  for (let visit = 0; visit < 2; visit++) {
    passed(await route('/?lang=en', { country: 'TJ' }));
    passed(await route('/ru?lang=ru', { country: 'DE' }));
  }
});

test('an explicit query for the opposite language moves once to that language path', async () => {
  const english = await route('/ru?lang=en&modal=contact', { country: 'RU' });
  assert.equal(english.status, 307);
  assert.equal(english.headers.get('location'), '/?lang=en&modal=contact');
  passed(await route(english.headers.get('location'), { country: 'RU' }));
  const russian = await route('/?lang=ru&utm_source=test', { country: 'DE' });
  assert.equal(russian.status, 307);
  assert.equal(russian.headers.get('location'), '/ru?lang=ru&utm_source=test');
  passed(await route(russian.headers.get('location'), { country: 'DE' }));
});

test('remembered explicit choices override country on subsequent root visits', async () => {
  passed(await route('/', { country: 'RU', cookie: 'other=value; mirwink_lang=en; another=x' }));
  const response = await route('/', { country: 'DE', cookie: 'mirwink_lang=ru' });
  assert.equal(response.status, 307);
  assert.equal(response.headers.get('location'), '/ru');
  privateResponse(response);
});

test('a direct Russian URL stays Russian regardless of country or saved English choice', async () => {
  for (const country of ['RU', 'DE', undefined]) {
    const response = await route('/ru?utm_source=shared', { country, cookie: 'mirwink_lang=en' });
    passed(response);
    assert.equal(response.headers.get('set-cookie'), null);
  }
});

test('crawler visits retain stable language URLs regardless of geolocation and cookies', async () => {
  for (const agent of ['Googlebot/2.1', 'Google-InspectionTool/1.0', 'GoogleOther', 'Mediapartners-Google', 'YandexBot/3.0', 'YandexImages/3.0', 'bingbot/2.0', 'BingPreview/1.0', 'DuckDuckBot/1.0', 'Applebot/0.1', 'Baiduspider', 'Yahoo! Slurp', 'facebookexternalhit/1.1', 'TelegramBot']) {
    for (const pathname of ['/', '/ru', '/?lang=ru']) {
      const response = await route(pathname, { country: 'RU', cookie: 'mirwink_lang=ru', agent });
      passed(response);
      assert.equal(response.headers.get('set-cookie'), null);
    }
  }
});

test('automatic redirect retains campaign, modal and encoded query parameters', async () => {
  const response = await route('/?utm_source=mail&modal=contact&value=a%26b', { country: 'TJ' });
  assert.equal(response.headers.get('location'), '/ru?utm_source=mail&modal=contact&value=a%26b');
  assert.equal(response.headers.get('location').includes('#'), false, 'fragments are not sent in HTTP requests; browser retention needs a browser test');
  passed(await route(response.headers.get('location'), { country: 'TJ' }));
});

test('invalid language inputs cannot inject cookies or redirect off site', async () => {
  for (const cookie of ['mirwink_lang=invalid', 'mirwink_lang=ru=evil', 'prefix_mirwink_lang=ru', 'mirwink_lang=%72%75']) {
    passed(await route('/?lang=https%3A%2F%2Fevil.example', { country: 'DE', cookie }));
  }
  const response = await route('/?lang=invalid&next=https://evil.example', { country: 'RU' });
  assert.equal(response.headers.get('location'), '/ru?lang=invalid&next=https://evil.example');
  assert.equal(response.headers.get('set-cookie'), null);
});

test('HEAD follows the GET route while mutation methods are never redirected', async () => {
  assert.equal((await route('/', { country: 'RU', method: 'HEAD' })).status, 307);
  for (const method of ['POST', 'PUT', 'DELETE', 'OPTIONS']) {
    const response = await route('/?lang=ru', { country: 'RU', method });
    passed(response);
    assert.equal(response.headers.get('set-cookie'), null);
  }
});

test('local development falls back to English and avoids Secure cookies on HTTP', async () => {
  passed(await route('/', { origin: 'http://localhost:3000' }));
  const response = await route('/?lang=en', { origin: 'http://localhost:3000' });
  assert.equal(response.headers.get('set-cookie'), 'mirwink_lang=en; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax');
});
