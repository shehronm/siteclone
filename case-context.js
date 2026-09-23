(() => {
  'use strict';
  const ru = document.documentElement.lang === 'ru';
  // Copy describes visible product paths, not unverified client metrics or delivery dates.
  const cases = {
    piptan: {
      en: ['Task', 'Make it easier to move from understanding the property offer to contacting an advisor.', 'Solution', 'Company information, available opportunities, editorial content and clear contact routes sit in one journey.', 'Result visible in the product', 'Visitors can explore the offer and open a direct enquiry from the relevant page. Conversion metrics have not been supplied.'],
      ru: ['Задача', 'Сделать путь от знакомства с объектами до обращения к консультанту понятнее.', 'Решение', 'Объединены информация о компании, инвестиционные предложения, полезные материалы и способы связи.', 'Что можно проверить', 'Посетитель может изучить предложение и перейти к прямому обращению с нужной страницы. Метрики конверсии не предоставлены.'],
    },
    haar: {
      en: ['Task', 'Help a salon customer choose the right service and a convenient appointment.', 'Solution', 'Service options, specialist, location and time are presented as one booking journey.', 'Result visible in the product', 'A user can review the booking flow and account tools in the preview. Live availability and payments depend on the salon configuration.'],
      ru: ['Задача', 'Помочь клиенту салона выбрать услугу и удобное время без лишних шагов.', 'Решение', 'Выбор услуги, мастера, локации и времени объединён в один сценарий записи.', 'Что можно проверить', 'В демо можно пройти сценарий записи и увидеть инструменты личного кабинета. Доступность времени и оплата зависят от настройки салона.'],
    },
    krema: {
      en: ['Task', 'Make choosing specialty coffee understandable without losing product details.', 'Solution', 'Catalogue filters, flavour profiles, grind and weight options, cart and checkout form one sequence.', 'Result visible in the product', 'The preview demonstrates product comparison and a cart. It does not take live payments or create orders.'],
      ru: ['Задача', 'Помочь покупателю выбрать кофе, сохранив важные детали о продукте.', 'Решение', 'Фильтры, вкусовые профили, выбор помола и веса, корзина и оформление собраны в последовательный сценарий.', 'Что можно проверить', 'В демо можно изучить товары и корзину. Реальная оплата и создание заказа не выполняются.'],
    },
    'ai-workspace': {
      en: ['Design brief', 'Turn repeated questions and scattered knowledge into an assistant with a defined purpose.', 'Proposed scope', 'Connect approved sources and tools; define permissions, review points and exception handling.', 'Status', 'Capability concept based on Dust. Client deployment, delivery dates and measured outcomes are not claimed.'],
      ru: ['Проектная задача', 'Собрать повторяющиеся вопросы и знания компании в помощника с понятной ролью.', 'Предлагаемый подход', 'Подключить согласованные источники и инструменты; определить доступы, проверки и обработку исключений.', 'Статус', 'Концепция на базе Dust. Внедрение у клиента, сроки и измеримые результаты не заявлены.'],
    },
    'connected-crm': {
      en: ['Design brief', 'Keep incoming enquiries and follow-up in one coherent process.', 'Proposed scope', 'Define pipeline and ownership, then connect forms, records and next steps with duplicate checks.', 'Status', 'Capability concept based on Twenty. Client deployment, delivery dates and measured outcomes are not claimed.'],
      ru: ['Проектная задача', 'Не терять контекст заявки при передаче между этапами продаж.', 'Предлагаемый подход', 'Определить воронку и ответственных, связать заявки с карточками клиентов и задачами, проверить дубли.', 'Статус', 'Концепция на базе Twenty. Внедрение у клиента, сроки и измеримые результаты не заявлены.'],
    },
    telegram: {
      en: ['Design brief', 'Give customers a direct path from a conversation to a service request or booking.', 'Proposed scope', 'Design a bot or Mini App, gather the right details and route the request to a person or system.', 'Status', 'Service concept; no live client bot, delivery dates or measured outcomes are claimed.'],
      ru: ['Проектная задача', 'Связать диалог с клиентом с оформлением заявки или записи.', 'Предлагаемый подход', 'Спроектировать бота или Mini App, собрать нужные данные и передать запрос сотруднику или системе.', 'Статус', 'Концепция услуги; работающий клиентский бот, сроки и измеримые результаты не заявлены.'],
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

  // Modals are rendered by React on demand. Reattach after a remount.
  const sync = () => document.querySelectorAll('[data-modal]').forEach(dialog => { addContext(dialog); updateContactIntro(dialog); });
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
