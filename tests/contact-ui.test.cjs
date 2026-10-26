'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Exercise the actual shipped component function without reimplementing its
// validation/state logic. The distributed site contains compiled React chunks,
// rather than the original JSX sources.
const bundle = fs.readFileSync(path.join(__dirname, '../next-assets/static/immutable/chunks/18zr536gj0psb-mirwink-contacts3.js'), 'utf8');
const start = bundle.indexOf('function MiroContactForm() {');
const end = bundle.indexOf('\n}],604660)', start);
assert.ok(start >= 0 && end > start, 'Active form component must be present in the shipped chunk');
const componentSource = bundle.slice(start, end) + "\n}";

function harness(lang = 'ru') {
  const state = [];
  const refs = [];
  let stateIndex = 0;
  let refIndex = 0;
  let delivered = [];
  let clipboard = '';
  const React = {
    useState(initial) {
      const index = stateIndex++;
      if (!Object.hasOwn(state, index)) state[index] = initial;
      return [state[index], value => { state[index] = value; }];
    },
    useRef(initial) {
      const index = refIndex++;
      if (!refs[index]) refs[index] = { current: initial };
      return refs[index];
    },
  };
  const element = (type, props) => ({ type, props });
  const context = {
    i(id) {
      if (id === 271645) return React;
      if (id === 843476) return { jsx: element, jsxs: element };
      throw new Error(`Unexpected module ${id}`);
    },
  };
  const fetchMock = async (url, options) => {
    assert.equal(url, '/api/contact');
    delivered.push(JSON.parse(options.body));
    return { ok: true, headers: { get: () => 'application/json; charset=utf-8' }, json: async () => ({ ok: true }) };
  };
  const component = new Function('e', 'document', 'fetch', 'navigator', `${componentSource}\nreturn MiroContactForm;`)(
    context,
    { documentElement: { lang } },
    fetchMock,
    { clipboard: { writeText: async text => { clipboard = text; } } },
  );
  const render = () => { stateIndex = 0; refIndex = 0; return component(); };
  return { render, get delivered() { return delivered; }, get clipboard() { return clipboard; } };
}

function find(element, predicate) {
  if (!element || typeof element !== 'object') return null;
  if (predicate(element)) return element;
  const children = element.props?.children;
  for (const child of Array.isArray(children) ? children : [children]) {
    const match = find(child, predicate);
    if (match) return match;
  }
  return null;
}
function text(element) {
  if (Array.isArray(element)) return element.map(text).join('');
  if (element && typeof element === 'object') return text(element.props?.children);
  return typeof element === 'string' ? element : '';
}
function control(form, name) { return find(form, el => el.type === 'input' && el.props.name === name); }
function status(form) { return find(form, el => el.props?.role === 'status' && el.type === 'p'); }

async function submit(form, name = 'Test client', message = 'Please develop our new website.') {
  let validityCalls = 0;
  const fields = {
    name: { value: name, validationMessage: '', setCustomValidity(value) { this.validationMessage = value; } },
    phone: { value: control(form, 'phone').props.value, validationMessage: '', setCustomValidity(value) { this.validationMessage = value; } },
    telegram: { value: control(form, 'telegram').props.value, validationMessage: '', setCustomValidity(value) { this.validationMessage = value; } },
    message: { value: message, validationMessage: '', setCustomValidity(value) { this.validationMessage = value; } },
    website: { value: '' },
  };
  await form.props.onSubmit({
    preventDefault() {},
    currentTarget: { elements: fields, reportValidity() { validityCalls++; return !Object.values(fields).some(field => field.validationMessage); } },
  });
  assert.equal(validityCalls, 1);
  return fields;
}

for (const lang of ['ru', 'en']) {
  test(`client form requires the international phone and keeps email/Telegram optional (${lang})`, async () => {
    const app = harness(lang);
    let form = app.render();
    const formFields = find(form, el => el.type === 'div' && el.props?.className?.includes('flex-1'))?.props.children;
    assert.deepEqual(formFields.slice(0, 5).map(el => el.props.children[1].props.name), ['name', 'phone', 'telegram', 'email', 'topic']);
    const phone = control(form, 'phone');
    assert.equal(phone.props.type, 'tel');
    assert.equal(phone.props.required, true);
    assert.equal(phone.props.autoComplete, 'tel');
    assert.equal(phone.props.inputMode, 'tel');
    assert.equal(phone.props.placeholder, '+992 90 123 45 67');
    const email = control(form, 'email');
    assert.equal(email.props.required, undefined);
    assert.equal(email.props['aria-label'], lang === 'ru' ? 'Почта (необязательно)' : 'Email (optional)');
    const telegram = control(form, 'telegram');
    assert.equal(telegram.props.required, undefined);
    assert.equal(telegram.props.placeholder, '@username');
    assert.equal(telegram.props['aria-label'], lang === 'ru' ? 'Telegram (необязательно)' : 'Telegram (optional)');

    // The phone starts empty, but focus inserts a visible + prefix.
    phone.props.onFocus();
    form = app.render();
    assert.equal(control(form, 'phone').props.value, '+');
    let invalid = await submit(form);
    assert.equal(app.delivered.length, 0);
    assert.equal(invalid.phone.validationMessage, lang === 'ru' ? 'Укажите номер телефона.' : 'Enter your phone number.');

    control(form, 'phone').props.onChange({ target: { value: '+992' } });
    form = app.render();
    assert.equal(control(form, 'phone').props.value, '+992 ');
    // Backspace over auto-inserted space must let the user edit the calling code.
    control(form, 'phone').props.onChange({ target: { value: '+992' } });
    form = app.render();
    assert.equal(control(form, 'phone').props.value, '+99');
    control(form, 'phone').props.onChange({ target: { value: '+992901234567' } });
    form = app.render();
    assert.equal(control(form, 'phone').props.value, '+992 901234567');
    control(form, 'name').props.onChange({ target: { value: 'Test client' } });
    find(form, el => el.type === 'textarea')?.props.onChange({ target: { value: 'Please develop our new website.' } });
    form = app.render();
    await submit(form);
    assert.equal(app.delivered.length, 1);
    assert.equal(app.delivered[0].phone, '+992901234567');
    assert.equal(app.delivered[0].email, '');
    assert.equal(app.delivered[0].telegram, '');
    form = app.render();
    assert.equal(text(status(form)), lang === 'ru' ? 'Заявка отправлена. Мы свяжемся с вами по указанному номеру телефона.' : 'Your enquiry was sent. We will contact you using the phone number provided.');
    const copy = find(form, el => el.type === 'button' && text(el) === (lang === 'ru' ? 'Скопировать бриф' : 'Copy brief'));
    await copy.props.onClick();
    assert.ok(app.clipboard.includes('Phone: +992901234567'));
    assert.ok(app.clipboard.includes(`Telegram: ${lang === 'ru' ? 'не указан' : 'not provided'}`));
    assert.ok(app.clipboard.includes(`Email: ${lang === 'ru' ? 'не указан' : 'not provided'}`));
  });

  test(`client includes email and optional Telegram when provided (${lang})`, async () => {
    const app = harness(lang);
    let form = app.render();
    control(form, 'name').props.onChange({ target: { value: 'Test client' } });
    control(form, 'phone').props.onChange({ target: { value: '+7 (999) 123 45 67' } });
    control(form, 'telegram').props.onChange({ target: { value: '@mirwink_user' } });
    control(form, 'email').props.onChange({ target: { value: 'client@example.com' } });
    find(form, el => el.type === 'textarea').props.onChange({ target: { value: 'Please develop our new website.' } });
    form = app.render();
    assert.equal(control(form, 'phone').props.value, '+7 9991234567');
    await submit(form);
    assert.deepEqual([app.delivered[0].phone, app.delivered[0].telegram, app.delivered[0].email], ['+79991234567', '@mirwink_user', 'client@example.com']);
    form = app.render();
    assert.equal(text(status(form)), lang === 'ru' ? 'Заявка отправлена. Мы свяжемся с вами по указанному номеру телефона.' : 'Your enquiry was sent. We will contact you using the phone number provided.');
    const copy = find(form, el => el.type === 'button' && text(el) === (lang === 'ru' ? 'Скопировать бриф' : 'Copy brief'));
    await copy.props.onClick();
    assert.ok(app.clipboard.includes('Telegram: @mirwink_user'));
    assert.ok(app.clipboard.includes('Email: client@example.com'));

    // A different phone must be treated as a distinct brief, not a duplicate.
    control(form, 'phone').props.onChange({ target: { value: '+998901234567' } });
    form = app.render();
    assert.equal(control(form, 'phone').props.value, '+998 901234567');
    await submit(form);
    assert.equal(app.delivered.length, 2);
    assert.equal(app.delivered[1].phone, '+998901234567');
  });

  test(`client blocks invalid phone and filled Telegram (${lang})`, async () => {
    const app = harness(lang);
    let form = app.render();
    control(form, 'phone').props.onChange({ target: { value: '+123' } });
    form = app.render();
    const short = await submit(form);
    assert.ok(short.phone.validationMessage);
    assert.equal(app.delivered.length, 0);
    control(form, 'phone').props.onChange({ target: { value: '+992901234567' } });
    control(form, 'telegram').props.onChange({ target: { value: 'bad handle!' } });
    form = app.render();
    const invalidTelegram = await submit(form);
    assert.ok(invalidTelegram.telegram.validationMessage);
    assert.equal(app.delivered.length, 0);
  });
}

test('both HTML entrypoints load the newly versioned contact component', () => {
  const assets = path.join(__dirname, '../next-assets/static/immutable/chunks');
  const oldLoader = '0cqqckwhc3qa9-mirwink-history3.js';
  const newLoader = '0cqqckwhc3qa9-mirwink-history4.js';
  const oldForm = '18zr536gj0psb-mirwink-contacts2.js';
  const newForm = '18zr536gj0psb-mirwink-contacts3.js';
  for (const file of ['index.html', 'ru/index.html']) {
    const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    assert.ok(html.includes(newLoader), `${file} must load the new entry chunk`);
    assert.ok(!html.includes(oldLoader), `${file} must not reference the stale entry chunk`);
  }
  const loader = fs.readFileSync(path.join(assets, newLoader), 'utf8');
  assert.ok(loader.includes(newForm), 'New loader must import the updated contact form');
  assert.ok(!loader.includes(oldForm), 'New loader must not import the stale form');
  assert.ok(fs.existsSync(path.join(assets, oldLoader)), 'Keep old loader for open sessions');
  assert.ok(fs.existsSync(path.join(assets, oldForm)), 'Keep old form for open sessions');
});
