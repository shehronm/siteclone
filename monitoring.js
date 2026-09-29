(() => {
  'use strict';
  // Keep local development offline and never send modal/query contents as telemetry.
  if (['localhost', '127.0.0.1', '::1'].includes(location.hostname)) return;
  window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };
  window.si('beforeSend', event => {
    const url = new URL(event.url, location.origin);
    url.search = '';
    url.hash = '';
    return { ...event, url: url.href, route: url.pathname };
  });
  const script = document.createElement('script');
  script.src = '/_vercel/speed-insights/script.js';
  script.defer = true;
  script.fetchPriority = 'low';
  document.head.appendChild(script);
})();
