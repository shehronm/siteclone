const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../service-navigation.js'), 'utf8');
const origin = 'https://mirwink.ru';

class Events {
  listeners = new Map();
  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(listener);
  }
  emit(type, event = {}) {
    for (const listener of this.listeners.get(type) || []) listener(event);
  }
}

function fixture({ page = '/ru/services/telegram', referrer = '', stored = null, prior = [], navigation = 'navigate' } = {}) {
  let url = new URL(page, origin);
  const location = {};
  for (const key of ['href', 'origin', 'pathname', 'search', 'hash']) {
    Object.defineProperty(location, key, { get: () => url[key] });
  }
  class Element extends Events {
    closest() { return null; }
  }
  class Link extends Element {
    constructor(href) { super(); this.href = href; }
    set href(value) { this.destination = new URL(value, url).href; }
    get href() { return this.destination; }
  }
  const back = new Link('/ru?lang=ru#clients');
  const main = new Element();
  main.scrollTop = 4837;
  main.scrollTo = ({ top }) => { main.scrollTop = top; };
  let modal;
  const document = new Events();
  Object.assign(document, {
    referrer,
    documentElement: { dataset: {} },
    readyState: 'complete',
    fonts: { status: 'loaded' },
    querySelector: selector => selector === '[data-service-back]' ? back : null,
    querySelectorAll: selector => selector === '.custom-scrollbar' ? [main] : selector === '[data-modal]' && modal ? [modal] : [],
  });
  const window = new Events();
  const queue = [];
  const entries = prior.map((entry, index) => ({ url: new URL(entry, origin), state: null, document: index }));
  const documentId = entries.length;
  entries.push({ url, state: null, document: documentId });
  let index = entries.length - 1;
  let backCalls = 0;
  const history = {
    get state() { return entries[index].state; },
    get length() { return entries.length; },
    replaceState(state) { entries[index].state = state; },
    back() {
      backCalls++;
      queue.push(() => {
        if (index === 0) return;
        const fromDocument = entries[index].document;
        index--;
        url = entries[index].url;
        // The old document receives popstate only for same-document traversal.
        if (entries[index].document === fromDocument) window.emit('popstate', { state: history.state });
      });
    },
  };
  let saved = stored;
  const frames = [];
  const observers = [];
  const sizeObservers = [];
  class MutationObserver {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe() { this.active = true; }
    disconnect() { this.active = false; }
  }
  class ResizeObserver {
    constructor(callback) { this.callback = callback; sizeObservers.push(this); }
    observe() { this.active = true; }
    disconnect() { this.active = false; }
  }
  const context = vm.createContext({
    URL, Date, Number, Element, MutationObserver, ResizeObserver, location, history, document, window,
    sessionStorage: { getItem: () => saved, setItem: (_key, value) => { saved = value; } },
    performance: { getEntriesByType: () => [{ type: navigation }], now: () => 0 },
    requestAnimationFrame: callback => { frames.push(callback); },
  });
  vm.runInContext(source, context, { filename: 'service-navigation.js' });
  return {
    location, history, document, window, back, main,
    get backCalls() { return backCalls; },
    get saved() { return saved; },
    get scheduledRestores() { return frames.length; },
    resizeMain(top) {
      main.scrollTop = top;
      for (const observer of sizeObservers) if (observer.active) observer.callback();
    },
    mountModal(name) {
      modal = new Element();
      modal.dataset = { modal: name };
      modal.scrollTop = 0;
      modal.querySelector = () => null;
      modal.scrollTo = ({ top }) => { modal.scrollTop = top; };
      for (const observer of observers) if (observer.active) observer.callback();
      return modal;
    },
    hash(value) {
      url = new URL(value, url);
      entries.splice(index + 1);
      entries.push({ url, state: null, document: documentId });
      index++;
    },
    flushHistory() {
      let budget = 20;
      while (queue.length) {
        assert.ok(budget-- > 0, 'history traversal must terminate');
        queue.shift()();
      }
    },
    clickBack(overrides = {}) {
      const event = { button: 0, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...overrides };
      back.emit('click', event);
      return event;
    },
  };
}

test('page Back skips the service section history and reaches its originating preview', () => {
  const preview = '/ru?lang=ru&modal=telegram#clients';
  const app = fixture({ referrer: origin + preview, prior: [preview] });
  app.hash('#scenarios');
  app.hash('#main');
  assert.equal(app.clickBack().defaultPrevented, true);
  app.flushHistory();
  assert.equal(app.location.href, origin + preview);
  assert.equal(app.backCalls, 3);
});

test('the browser Back button still removes exactly one service hash entry', () => {
  const preview = '/ru?lang=ru&modal=telegram#clients';
  const app = fixture({ referrer: origin + preview, prior: [preview] });
  app.hash('#scenarios');
  app.hash('#main');
  app.history.back();
  app.flushHistory();
  assert.equal(app.location.href, origin + '/ru/services/telegram#scenarios');
  assert.equal(app.backCalls, 1);
});

test('a fresh direct visit keeps the home section fallback, even with unrelated prior history', () => {
  const app = fixture({ referrer: 'https://www.google.com/', prior: ['https://www.google.com/search?q=mirwink'] });
  const event = app.clickBack();
  app.flushHistory();
  assert.equal(event.defaultPrevented, false, 'native fallback link must be allowed to navigate');
  assert.equal(app.back.href, origin + '/ru?lang=ru#clients');
  assert.equal(app.backCalls, 0, 'the page must not send a direct visitor back to a search engine');
});

test('modified Back clicks preserve native new-tab behavior', () => {
  const app = fixture({ referrer: origin + '/ru', prior: ['/ru'] });
  assert.equal(app.clickBack({ ctrlKey: true }).defaultPrevented, false);
  assert.equal(app.backCalls, 0);
});

test('returning from BFCache resets the page Back traversal intent', () => {
  const app = fixture({ referrer: origin + '/ru', prior: ['/ru'] });
  app.hash('#scenarios');
  app.clickBack();
  // A pageshow signals that this document was revisited; old intent must not
  // turn a later ordinary browser traversal into a jump over every section.
  app.window.emit('pageshow', { persisted: true });
  app.flushHistory();
  assert.equal(app.location.href, origin + '/ru/services/telegram');
  assert.equal(app.backCalls, 1);
});

const invalidSnapshots = {
  empty: null,
  string: 'bad',
  badCoordinates: { url: '/ru', top: '4837', at: Date.now() },
  old: { url: '/ru', top: 100, at: Date.now() - 8_000_000 },
  future: { url: '/ru', top: 100, at: Date.now() + 8_000_000 },
  external: { url: '/\\example.org/', top: 100, at: Date.now() },
  modal: { url: '/ru', top: 100, at: Date.now(), modal: { name: 'telegram', top: 'bad' } },
};
const malformedCases = ['{', 'null', 'true', '42', '"invalid"', '[]', '{"entries":[]}', '{"entries":null}', JSON.stringify({ entries: invalidSnapshots })];
for (const [index, stored] of malformedCases.entries()) {
  test(`malformed storage case ${index + 1} cannot break saving a visitor's current location`, () => {
    const app = fixture({ page: '/ru', stored });
    assert.doesNotThrow(() => app.window.emit('pagehide'));
    const saved = JSON.parse(app.saved);
    assert.equal(saved.entries['/ru'].top, 4837);
    assert.equal(Object.keys(saved.entries).length, 1, 'invalid historical entries must not survive the new snapshot');
  });
}

test('invalid modal coordinates cannot start a restore loop on reload', () => {
  const stored = JSON.stringify({ entries: { '/ru': invalidSnapshots.modal } });
  const app = fixture({ page: '/ru', stored, navigation: 'reload' });
  assert.equal(app.scheduledRestores, 0);
  assert.equal(app.main.scrollTop, 4837);
});

test('restored preview receives its saved position on mount before the next animation frame', () => {
  const saved = { url: '/ru', top: 5550, at: Date.now(), modal: { name: 'connected-crm', top: 849 } };
  const app = fixture({ page: '/ru', navigation: 'back_forward', stored: JSON.stringify({ entries: { '/ru': saved } }) });
  assert.equal(app.main.scrollTop, 5550, 'existing page position is restored synchronously');
  assert.equal(app.mountModal('connected-crm').scrollTop, 849, 'new preview is positioned in the mutation phase');
});

test('deliberate scrolling cancels the pre-paint restoration observer', () => {
  const saved = { url: '/ru', top: 5550, at: Date.now(), modal: { name: 'connected-crm', top: 849 } };
  const app = fixture({ page: '/ru', navigation: 'back_forward', stored: JSON.stringify({ entries: { '/ru': saved } }) });
  app.document.emit('wheel');
  assert.equal(app.mountModal('connected-crm').scrollTop, 0);
});

test('content size changes restore the position before paint until the visitor scrolls', () => {
  const saved = { url: '/ru', top: 5550, at: Date.now() };
  const app = fixture({ page: '/ru', navigation: 'back_forward', stored: JSON.stringify({ entries: { '/ru': saved } }) });
  app.resizeMain(2400);
  assert.equal(app.main.scrollTop, 5550);
  app.document.emit('wheel');
  app.resizeMain(2400);
  assert.equal(app.main.scrollTop, 2400, 'resizing no longer overrides deliberate user navigation');
});
