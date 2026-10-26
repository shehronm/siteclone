'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const schema = html => JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);

test('service generation includes both local landing pages with working language and contact destinations', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mirwink-local-build-'));
  try {
    for (const folder of ['scripts', 'content']) fs.cpSync(path.join(root, folder), path.join(dir, folder), { recursive: true });
    fs.copyFileSync(path.join(root, 'navigation-boot.js'), path.join(dir, 'navigation-boot.js'));
    execFileSync(process.execPath, [path.join(dir, 'scripts/generate-services.cjs')]);
    for (const [route, lang, home] of [['/khujand', 'en', '/'], ['/ru/khujand', 'ru', '/ru']]) {
      const html = fs.readFileSync(path.join(dir, route, 'index.html'), 'utf8');
      assert.match(html, new RegExp(`<html lang="${lang}"`));
      assert.ok(html.includes(`rel="canonical" href="https://mirwink.ru${route}"`));
      assert.ok(html.includes('hreflang="en" href="https://mirwink.ru/khujand"'));
      assert.ok(html.includes('hreflang="ru" href="https://mirwink.ru/ru/khujand"'));
      assert.ok(html.includes(`href="${home}?lang=${lang}&modal=contact"`));
      const graph = schema(html)['@graph'];
      const service = graph.find(node => node['@type'] === 'Service');
      assert.equal(service.url, 'https://mirwink.ru' + route);
      assert.equal(service.areaServed.name, 'Khujand');
      assert.ok(!graph.some(node => node['@type'] === 'LocalBusiness' || node.streetAddress));
      assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
      for (const link of html.matchAll(/href="(\/(?:ru\/)?(?:services\/[^"?#]+|khujand))"/g)) {
        assert.ok(fs.existsSync(path.join(dir, link[1], 'index.html')), `Missing destination ${link[1]}`);
      }
    }
  } finally {
    assert.equal(path.dirname(path.resolve(dir)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(dir).startsWith('mirwink-local-build-'));
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('local landing URLs in the sitemap are served by the configured Vercel routes', () => {
  const config = JSON.parse(read('vercel.json'));
  for (const route of ['/khujand', '/ru/khujand']) {
    const rewrite = config.rewrites.find(item => item.source === route);
    assert.ok(rewrite, `Missing route ${route}`);
    assert.equal(rewrite.destination, route + '/index.html');
    assert.ok(fs.existsSync(path.join(root, rewrite.destination)));
    assert.ok(read('sitemap.xml').includes(`<loc>https://mirwink.ru${route}</loc>`));
    const redirect = config.redirects.find(item => item.source === route + '/index.html');
    assert.equal(redirect?.destination, route);
    assert.equal(redirect?.permanent, true);
  }
});

test('homepages expose the local page and consistent organisation geography before and after hydration', () => {
  for (const [file, route] of [['index.html', '/khujand'], ['ru/index.html', '/ru/khujand']]) {
    const html = read(file);
    const graph = JSON.parse(html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)[1])['@graph'];
    assert.equal(graph.find(node => node['@type'] === 'Organization').areaServed?.name, 'Khujand');
    assert.ok(html.includes(`href="${route}"`), 'Crawlable link in initial HTML');
    const flight = [...html.matchAll(/self\.__next_f\.push\((\[[\s\S]*?)\)<\/script>/g)]
      .map(match => JSON.parse(match[1])).filter(value => value[0] === 1).map(value => value[1]).join('');
    assert.ok(flight.includes(`"href":"${route}"`), 'Local link survives hydration');
    assert.ok(flight.includes('Khujand'), 'Embedded organisation data includes geography');
    const footerRows = flight.split('\n').filter(line => /^\w+:\["\$","footer",/.test(line));
    assert.ok(footerRows.length, 'Hydration includes footer data');
    for (const row of footerRows) {
      assert.ok(row.includes(`"href":"${route}"`), 'Every footer payload keeps the local link');
      assert.ok(/Худжанд|Khujand/.test(row), 'Every footer payload keeps the location');
    }
  }
});
