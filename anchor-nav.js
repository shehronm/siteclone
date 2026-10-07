(() => {
  'use strict';

  const samePath = (a, b) => (a.replace(/\/+$/, '') || '/') === (b.replace(/\/+$/, '') || '/');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let previousHash = location.hash;

  const scrollToHash = hash => {
    const id = decodeURIComponent(hash.slice(1));
    if (!document.getElementById(id)) return false;
    let attempts = 0;
    const scroll = () => {
      const target = document.getElementById(id);
      if (!target) return;
      if (!target.getClientRects().length && attempts++ < 40) {
        setTimeout(scroll, 100);
        return;
      }
      target.scrollIntoView({
        block: 'start',
        behavior: reducedMotion.matches ? 'auto' : 'smooth',
      });
    };
    requestAnimationFrame(scroll);
    return true;
  };

  document.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!link) return;
    const destination = new URL(link.href, location.href);
    if (destination.origin !== location.origin || !destination.hash ||
        destination.search !== location.search || !samePath(destination.pathname, location.pathname) ||
        !document.getElementById(decodeURIComponent(destination.hash.slice(1)))) return;

    event.preventDefault();
    event.stopPropagation();
    document.querySelector('header button[aria-expanded="true"]')?.click();
    if (location.hash !== destination.hash) {
      history.pushState(history.state, '', location.pathname + location.search + destination.hash);
    }
    previousHash = destination.hash;
    scrollToHash(destination.hash);
  }, true);

  window.addEventListener('popstate', () => {
    if (location.hash === previousHash) return;
    if (location.hash) scrollToHash(location.hash);
    else if (previousHash) {
      const scroller = document.querySelector('.custom-scrollbar') || document.scrollingElement;
      scroller.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    }
    previousHash = location.hash;
  });
  window.addEventListener('load', () => {
    if (location.hash && !document.documentElement.dataset.mirwinkScrollRestore) scrollToHash(location.hash);
  }, { once: true });
})();
