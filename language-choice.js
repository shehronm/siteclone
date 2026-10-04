/* Explicit language navigation. The server remembers ?lang= in its HttpOnly cookie. */
(function () {
  'use strict';
  var selector = 'a[data-mirwink-language], .miro-lang-switch a[hreflang], .mirwink-language-menu a[hreflang]';

  function languageLink(target) {
    return target instanceof Element ? target.closest(selector) : null;
  }

  function updateLink(link) {
    if (!link) return null;
    var language = link.getAttribute('data-mirwink-language') || link.getAttribute('hreflang');
    if (language !== 'en' && language !== 'ru') return null;
    var url = new URL(window.location.href);
    url.pathname = language === 'ru' ? '/ru' : '/';
    url.searchParams.set('lang', language);
    link.setAttribute('href', url.pathname + url.search + url.hash);
    return url;
  }

  function refreshLinks() {
    document.querySelectorAll(selector).forEach(updateLink);
  }

  // Keep copying/opening a switch in another tab accurate after modal/hash changes.
  ['pointerdown', 'focusin', 'contextmenu'].forEach(function (type) {
    document.addEventListener(type, function (event) { updateLink(languageLink(event.target)); }, true);
  });
  document.addEventListener('click', function (event) {
    var link = languageLink(event.target);
    var url = updateLink(link);
    if (!url || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank') return;
    // Native document navigation gets the other exported page and server preference.
    event.preventDefault();
    window.location.assign(url.href);
  }, true);
  window.addEventListener('hashchange', refreshLinks);
  window.addEventListener('popstate', refreshLinks);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refreshLinks, { once: true });
  else refreshLinks();
})();
