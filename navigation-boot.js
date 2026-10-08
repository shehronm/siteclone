/* Inlined at the start of <head>: history restoration must precede first paint. */
(() => {
  'use strict';
  const root = document.documentElement;
  const isHistory = () => {
    const entry = performance.getEntriesByType?.('navigation')[0];
    return entry ? entry.type === 'back_forward' : performance.navigation?.type === 2;
  };
  const mark = () => { root.dataset.mirwinkHistory = 'true'; };
  if (isHistory()) mark();
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    mark();
    window.dispatchEvent(new Event('mirwink:history'));
  });
  if (!root.dataset.mirwinkHistory || !/^\/(?:ru\/?)?$/.test(location.pathname)) return;
  const url = location.pathname + location.search + location.hash;
  let saved = history.state?.__mirwinkScroll;
  try { saved ||= JSON.parse(sessionStorage.getItem('mirwink:service-navigation:v1'))?.entries?.[url]; } catch {}
  if (!saved || saved.url !== url || !Number.isFinite(saved.top) || saved.top < 0 ||
      !Number.isFinite(saved.at) || Date.now() - saved.at < 0 || Date.now() - saved.at >= 7200000) return;
  root.dataset.mirwinkScrollRestore = 'true';
  const restore = () => {
    const scroller = document.querySelector('.custom-scrollbar.relative');
    if (scroller) scroller.scrollTop = saved.top;
  };
  // A parser mutation callback runs before rendering. The deferred navigation
  // controller takes over after hydration and keeps Lenis in sync.
  const observer = new MutationObserver(restore);
  observer.observe(document, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => { restore(); observer.disconnect(); }, { once: true });
})();
