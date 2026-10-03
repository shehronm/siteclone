(() => {
  'use strict';
  const ru = document.documentElement.lang === 'ru';
  // Copy describes visible product paths, not unverified client metrics or delivery dates.
  const cases = {
    piptan: {
      en: ['Task', 'Make it easier to move from understanding the property offer to contacting an advisor.', 'Solution', 'Company information, available opportunities, editorial content and clear contact routes sit in one journey.', 'Result visible in the product', 'Visitors can explore the offer and open a direct enquiry from the relevant page.'],
      ru: ['Задача', 'Сделать путь от знакомства с объектами до обращения к консультанту понятнее.', 'Решение', 'Объединены информация о компании, инвестиционные предложения, полезные материалы и способы связи.', 'Что можно проверить', 'Посетитель может изучить предложение и перейти к прямому обращению с нужной страницы.'],
    },
    haar: {
      en: ['Task', 'Help a salon customer choose the right service and a convenient appointment.', 'Solution', 'Service options, specialist, location and time are presented as one booking journey.', 'Result visible in the product', 'Service selection, appointments and account tools are connected in a single booking flow.'],
      ru: ['Задача', 'Помочь клиенту салона выбрать услугу и удобное время без лишних шагов.', 'Решение', 'Выбор услуги, мастера, локации и времени объединён в один сценарий записи.', 'Что можно проверить', 'Выбор услуги, запись и инструменты личного кабинета объединены в последовательный сценарий.'],
    },
    krema: {
      en: ['Task', 'Make choosing specialty coffee understandable without losing product details.', 'Solution', 'Catalogue filters, flavour profiles, grind and weight options, cart and checkout form one sequence.', 'Result visible in the product', 'Customers can compare products, choose grind and weight, and keep their selection in the cart.'],
      ru: ['Задача', 'Помочь покупателю выбрать кофе, сохранив важные детали о продукте.', 'Решение', 'Фильтры, вкусовые профили, выбор помола и веса, корзина и оформление собраны в последовательный сценарий.', 'Что можно проверить', 'Покупатели могут сравнивать товары, выбирать помол и вес и сохранять свой выбор в корзине.'],
    },
    'ai-workspace': {
      en: ['Design brief', 'Turn repeated questions and scattered knowledge into an assistant with a defined purpose.', 'Solution', 'Connect approved sources and tools; define permissions, review points and exception handling.', 'Status', 'AI workspace based on Dust: company knowledge, connected tools and access rules.'],
      ru: ['Проектная задача', 'Собрать повторяющиеся вопросы и знания компании в помощника с понятной ролью.', 'Решение', 'Подключить согласованные источники и инструменты; определить доступы, проверки и обработку исключений.', 'Статус', 'AI-пространство на базе Dust: знания компании, подключённые инструменты и правила доступа.'],
    },
    'connected-crm': {
      en: ['Design brief', 'Keep incoming enquiries and follow-up in one coherent process.', 'Solution', 'Define pipeline and ownership, then connect forms, records and next steps with duplicate checks.', 'Status', 'CRM based on Twenty: customer records, pipelines and follow-up.'],
      ru: ['Проектная задача', 'Не терять контекст заявки при передаче между этапами продаж.', 'Решение', 'Определить воронку и ответственных, связать заявки с карточками клиентов и задачами, проверить дубли.', 'Статус', 'CRM на базе Twenty: клиентские данные, воронки продаж и работа с обращениями.'],
    },
    telegram: {
      en: ['Design brief', 'Give customers a direct path from a conversation to a service request or booking.', 'Solution', 'Design a bot or Mini App, gather the right details and route the request to a person or system.', 'Status', 'Telegram services: bot and Mini App interfaces, request routing and integrations.'],
      ru: ['Проектная задача', 'Связать диалог с клиентом с оформлением заявки или записи.', 'Решение', 'Спроектировать бота или Mini App, собрать нужные данные и передать запрос сотруднику или системе.', 'Статус', 'Telegram-сервисы: интерфейсы ботов и Mini Apps, маршрутизация заявок и интеграции.'],
    },
  };

  function addContext(dialog) {
    const key = dialog.dataset.modal;
    const facts = cases[key]?.[ru ? 'ru' : 'en'];
    const article = dialog.querySelector('article.miro-case');
    const copy = article?.querySelector('.miro-case-copy');
    if (!facts || !copy || copy.querySelector('.miro-case-context')) return;
    const dl = document.createElement('dl');
    dl.className = 'miro-facts miro-case-context';
    for (let i = 0; i < facts.length; i += 2) {
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      dt.textContent = facts[i];
      dd.textContent = facts[i + 1];
      dl.append(dt, dd);
    }
    const note = [...copy.querySelectorAll('p')].at(-1);
    copy.insertBefore(dl, note || null);
  }

  function updateContactIntro(dialog) {
    if (dialog.dataset.modal !== 'contact') return;
    const oldText = ru ? 'Подготовьте бриф здесь, затем отправьте его из своей почты.' : 'Prepare your brief here, then send it from your email app.';
    const paragraph = [...dialog.querySelectorAll('p')].find(p => p.textContent.includes(oldText));
    if (paragraph) paragraph.textContent = ru
      ? 'Заполните форму, чтобы отправить заявку нашей команде. Мы используем данные только для ответа.'
      : 'Complete the form to send your enquiry directly to our team. We use these details only to respond.';
  }

  // React removes a closed modal, so return keyboard focus to the control that opened it.
  let pendingOpener = null;
  let openDialogs = new Set();
  const openers = new WeakMap();
  document.addEventListener('click', event => {
    const trigger = event.target instanceof Element ? event.target.closest('button, a[href]') : null;
    if (trigger && !trigger.closest('[data-modal], [role="dialog"]')) pendingOpener = trigger;
  }, true);

  // Modals are rendered by React on demand. Reattach after a remount.
  const sync = () => {
    const current = new Set(document.querySelectorAll('[data-modal]'));
    for (const dialog of current) {
      if (!openDialogs.has(dialog)) openers.set(dialog, pendingOpener?.isConnected ? pendingOpener : null);
      addContext(dialog);
      updateContactIntro(dialog);
    }
    if (!current.size) {
      for (const dialog of openDialogs) {
        const opener = openers.get(dialog);
        if (opener?.isConnected) opener.focus({ preventScroll: true });
      }
    }
    openDialogs = current;
  };
  let scheduled = false;
  const observe = () => {
    new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; sync(); });
    }).observe(document.body, { childList: true, subtree: true });
    sync();
  };
  if (document.body) observe();
  else document.addEventListener('DOMContentLoaded', observe, { once: true });
})();
