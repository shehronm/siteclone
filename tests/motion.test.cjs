const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');

class Events {
  callbacks = {};
  addEventListener(type, cb) { (this.callbacks[type] ||= []).push(cb); }
  emit(type, event = {}) { for (const cb of this.callbacks[type] || []) cb(event); }
  dispatchEvent(event) { this.emit(event.type, event); }
}

function boot({ type = 'navigate', saved, legacy = false, blockedStorage = false } = {}) {
  const window = new Events(), document = new Events();
  const scroller = { scrollTop: 0 };
  Object.assign(document, { documentElement: { dataset: {} }, querySelector: () => scroller });
  let observer;
  class MutationObserver {
    constructor(cb) { this.callback = cb; observer = this; }
    observe() {}
    disconnect() { this.disconnected = true; }
  }
  vm.runInNewContext(read('navigation-boot.js'), {
    document, window, MutationObserver, Event: class { constructor(type) { this.type = type; } },
    performance: legacy ? { navigation: { type: 2 } } : { getEntriesByType: () => [{ type }] },
    location: { pathname: '/ru', search: '?lang=ru', hash: '' },
    history: { state: null }, sessionStorage: { getItem() {
      if (blockedStorage) throw new Error('Storage denied');
      return JSON.stringify({ entries: { '/ru?lang=ru': saved } });
    } },
  });
  return { window, document, scroller, observer };
}
const snapshot = () => ({ url: '/ru?lang=ru', top: 5550, at: Date.now() });

for (const type of ['navigate', 'reload']) test(`${type} keeps the first-load intro even with a saved position`, () => {
  const f = boot({ type, saved: snapshot() });
  assert.equal(f.document.documentElement.dataset.mirwinkHistory, undefined);
  assert.equal(f.observer, undefined);
});
test('history restoration marks the document synchronously and restores during parsing', () => {
  const f = boot({ type: 'back_forward', saved: snapshot() });
  assert.equal(f.document.documentElement.dataset.mirwinkHistory, 'true');
  f.observer.callback();
  assert.equal(f.scroller.scrollTop, 5550);
  f.document.emit('DOMContentLoaded');
  assert.equal(f.observer.disconnected, true);
});
test('legacy history detection works without NavigationTiming entries', () => {
  assert.equal(boot({ legacy: true }).document.documentElement.dataset.mirwinkHistory, 'true');
});
test('expired positions and inaccessible storage do not break history intro suppression', () => {
  for (const options of [{ saved: { ...snapshot(), at: Date.now() - 7200001 } }, { blockedStorage: true }]) {
    const f = boot({ type: 'back_forward', ...options });
    assert.equal(f.document.documentElement.dataset.mirwinkHistory, 'true');
    assert.equal(f.observer, undefined);
  }
});
test('BFCache restoration marks history and notifies the mounted React intro', () => {
  const f = boot(); let notifications = 0;
  f.window.addEventListener('mirwink:history', () => notifications++);
  f.window.emit('pageshow', { persisted: false });
  assert.equal(notifications, 0);
  f.window.emit('pageshow', { persisted: true });
  assert.equal(notifications, 1);
  assert.equal(f.document.documentElement.dataset.mirwinkHistory, 'true');
});

function reveal({ reduced = false, history = false, support = true } = {}) {
  const window = new Events(), document = new Events(), motion = new Events();
  motion.matches = reduced;
  const element = (top, excluded = false) => ({
    tagName: 'P', dataset: {}, classList: { add() {} },
    closest: () => excluded ? {} : null, getClientRects: () => [1],
    getBoundingClientRect: () => ({ top }),
  });
  const above = element(50), below = element(1200), second = element(2000), form = element(2000, true);
  Object.assign(document, {
    documentElement: { dataset: history ? { mirwinkHistory: 'true' } : {} },
    body: { classList: { contains: () => true } }, querySelectorAll: () => [above, below, second, form],
  });
  let observer;
  class IntersectionObserver {
    elements = new Set();
    constructor(cb, options) { this.callback = cb; this.options = options; observer = this; }
    observe(el) { this.elements.add(el); }
    unobserve(el) { this.elements.delete(el); }
    disconnect() { this.elements.clear(); this.disconnected = true; }
    intersect(el, isIntersecting = true) {
      if (this.elements.has(el)) this.callback([{ target: el, isIntersecting }]);
    }
  }
  if (support) window.IntersectionObserver = IntersectionObserver;
  vm.runInNewContext(read('scroll-reveal.js'), { document, window, matchMedia: () => motion, IntersectionObserver, innerHeight: 800 });
  return { window, document, motion, observer, above, below, second, form };
}
for (const options of [{ reduced: true }, { history: true }, { support: false }]) test(`content stays visible without reveal setup: ${JSON.stringify(options)}`, () => {
  const f = reveal(options);
  assert.equal(f.observer, undefined);
  assert.equal(f.below.dataset.revealState, undefined);
});
test('only offscreen eligible content is observed; each reveal runs once', () => {
  const f = reveal();
  assert.equal(f.above.dataset.revealState, undefined);
  assert.equal(f.form.dataset.revealState, undefined);
  assert.equal(f.below.dataset.revealState, 'pending');
  f.observer.intersect(f.below, false);
  assert.equal(f.below.dataset.revealState, 'pending');
  f.observer.intersect(f.below);
  assert.equal(f.below.dataset.revealState, 'shown');
  assert.equal(f.observer.elements.has(f.below), false);
  f.observer.intersect(f.below, false);
  assert.equal(f.below.dataset.revealState, 'shown');
});
test('enabling reduced motion releases all pending content and stops observation', () => {
  const f = reveal(); f.motion.emit('change', { matches: true });
  assert.equal(f.below.dataset.revealState, 'shown');
  assert.equal(f.second.dataset.revealState, 'shown');
  assert.equal(f.observer.disconnected, true);
  assert.equal(f.document.documentElement.dataset.revealMotion, 'off');
});
test('BFCache restoration reveals pending content without replaying transitions', () => {
  const f = reveal(); f.window.emit('pageshow', { persisted: true });
  assert.equal(f.below.dataset.revealState, 'shown');
  assert.equal(f.document.documentElement.dataset.revealMotion, 'off');
});
test('keyboard focus makes pending content visible immediately', () => {
  const f = reveal(); f.document.emit('focusin', { target: { closest: () => f.below } });
  assert.equal(f.below.dataset.revealState, 'shown');
  assert.equal(f.observer.elements.has(f.below), false);
});
