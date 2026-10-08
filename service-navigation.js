(() => {
  'use strict';
  const KEY = 'mirwink:service-navigation:v1';
  const STATE = '__mirwinkScroll';
  const BACK = '__mirwinkServiceBack';
  const homePath = path => path === '/' || /^\/ru\/?$/.test(path);
  const servicePath = path => /^\/(?:ru\/)?services\/(?:ai-workspace|crm|telegram)\/?$/.test(path);
  const here = () => location.pathname + location.search + location.hash;
  const normalClick = event => event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;
  const valid = snapshot => {
    if (!snapshot || typeof snapshot.url !== 'string' || !snapshot.url.startsWith('/') ||
        snapshot.url.startsWith('//') || !Number.isFinite(snapshot.top) || snapshot.top < 0 ||
        !Number.isFinite(snapshot.at) || Date.now() - snapshot.at < 0 || Date.now() - snapshot.at >= 7200000) return false;
    try {
      const url = new URL(snapshot.url, location.origin);
      return url.origin === location.origin && homePath(url.pathname) && (!snapshot.modal ||
        (['ai-workspace', 'connected-crm', 'telegram'].includes(snapshot.modal.name) &&
         Number.isFinite(snapshot.modal.top) && snapshot.modal.top >= 0));
    } catch { return false; }
  };
  let storage = { entries: {} };
  try { storage = JSON.parse(sessionStorage.getItem(KEY)) || storage; } catch {}
  if (typeof storage !== 'object' || !storage.entries || typeof storage.entries !== 'object' || Array.isArray(storage.entries)) storage = { entries: {} };
  const write = () => { try { sessionStorage.setItem(KEY, JSON.stringify(storage)); } catch {} };
  const mainScroller = () => [...document.querySelectorAll('.custom-scrollbar')].find(el => !el.closest('[data-modal], [role="dialog"]'));
  const modalScroller = modal => modal?.querySelector('.custom-scrollbar') || modal;

  function remember() {
    const main = mainScroller();
    if (!main) return null;
    const modal = document.querySelector('[data-modal]');
    const snapshot = { url: here(), top: main.scrollTop, at: Date.now(), modal: modal ? {
      name: modal.getAttribute('data-modal'), top: modalScroller(modal).scrollTop
    } : null };
    storage.entries[snapshot.url] = snapshot;
    const entries = Object.entries(storage.entries).filter(([, entry]) => valid(entry)).sort((a, b) => b[1].at - a[1].at).slice(0, 20);
    storage.entries = Object.fromEntries(entries);
    write();
    try { history.replaceState({ ...history.state, [STATE]: snapshot }, '', location.href); } catch {}
    return snapshot;
  }

  function snapshotForEntry() {
    const own = history.state?.[STATE];
    if (valid(own) && own.url === here()) return own;
    const kind = performance.getEntriesByType('navigation')[0]?.type;
    const saved = storage.entries[here()];
    // A normal visit to the homepage must never inherit an old scroll position.
    return ['back_forward', 'reload'].includes(kind) && valid(saved) ? saved : null;
  }

  let restoring = false;
  let restoreRun = 0;
  let restoreObserver;
  let restoreSizeObserver;
  const disconnectRestoreObserver = () => {
    restoreObserver?.disconnect(); restoreObserver = null;
    restoreSizeObserver?.disconnect(); restoreSizeObserver = null;
  };
  function restore(snapshot) {
    if (!valid(snapshot) || snapshot.url !== here()) return;
    disconnectRestoreObserver();
    document.documentElement.dataset.mirwinkScrollRestore = 'true';
    restoring = true;
    const run = ++restoreRun, started = performance.now();
    let stableSince = 0;
    const observedSizes = new WeakSet();
    const watchSize = el => {
      if (!el || !restoreSizeObserver || observedSizes.has(el)) return;
      observedSizes.add(el); restoreSizeObserver.observe(el);
    };
    const watchContent = el => {
      watchSize(el);
      for (const child of el?.children || []) {
        watchSize(child);
        for (const content of child.children || []) watchSize(content);
      }
    };
    const move = (el, top) => {
      if (!el) return false;
      if (Math.abs(el.scrollTop - top) > 1) {
        if (el.__mirwinkLenis) {
          el.__mirwinkLenis.resize();
          el.__mirwinkLenis.scrollTo(top, { immediate: true, force: true });
        } else el.scrollTo({ top, behavior: 'instant' });
      }
      return Math.abs(el.scrollTop - top) <= 1;
    };
    const position = () => {
      const main = mainScroller();
      watchContent(main);
      let settled = move(main, snapshot.top) && !!main?.__mirwinkLenis;
      if (snapshot.modal) {
        const modal = [...document.querySelectorAll('[data-modal]')].find(el => el.dataset.modal === snapshot.modal.name);
        watchContent(modalScroller(modal));
        settled = move(modalScroller(modal), snapshot.modal.top) && !!modal && settled;
      }
      return settled;
    };
    // React mounts the preview after the static document has parsed. Apply its
    // saved offset in the mutation microtask, before the browser paints it at 0.
    const positionIfCurrent = () => { if (run === restoreRun && here() === snapshot.url) position(); };
    // Font/image layout can change scrollHeight without inserting DOM nodes.
    // ResizeObserver runs after layout and before paint, unlike the next RAF.
    if (typeof ResizeObserver === 'function') restoreSizeObserver = new ResizeObserver(positionIfCurrent);
    if (typeof MutationObserver === 'function') {
      restoreObserver = new MutationObserver(positionIfCurrent);
      restoreObserver.observe(document, { childList: true, subtree: true });
    }
    position();
    const frame = () => {
      if (run !== restoreRun) return;
      if (here() !== snapshot.url) { restoring = false; disconnectRestoreObserver(); return; }
      const settled = position() && document.readyState === 'complete' && document.fonts.status === 'loaded';
      if (!settled) stableSince = 0;
      else if (!stableSince) stableSince = performance.now();
      if ((stableSince && performance.now() - stableSince > 500) || performance.now() - started > 6000) {
        restoring = false; disconnectRestoreObserver(); return;
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  if (homePath(location.pathname)) {
    const initial = snapshotForEntry();
    if (initial) restore(initial);
    // Respect deliberate user scrolling instead of repeatedly dragging them back.
    const cancel = () => { restoring = false; restoreRun++; disconnectRestoreObserver(); };
    document.addEventListener('wheel', cancel, { passive: true });
    document.addEventListener('touchstart', cancel, { passive: true });
    document.addEventListener('keydown', event => {
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', 'Escape'].includes(event.key)) cancel();
    });
    document.addEventListener('click', event => {
      if (!normalClick(event) || !(event.target instanceof Element)) return;
      const preview = event.target.closest('[data-service-preview]');
      const link = event.target.closest('a[href]');
      if (preview) remember();
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || !servicePath(url.pathname)) return;
      const snapshot = remember();
      if (snapshot) { storage.origin = { ...snapshot, destination: url.pathname }; write(); }
    }, true);
    window.addEventListener('pagehide', () => { if (!restoring) remember(); });
    window.addEventListener('pageshow', event => {
      if (event.persisted) restore(snapshotForEntry());
    });
    window.addEventListener('popstate', () => restore(snapshotForEntry()));
  } else if (servicePath(location.pathname)) {
    let internal = history.state?.[BACK] === true;
    try {
      const from = new URL(document.referrer);
      internal ||= from.origin === location.origin && (homePath(from.pathname) || servicePath(from.pathname));
    } catch {}
    try { history.replaceState({ ...history.state, [BACK]: internal }, '', location.href); } catch {}
    const link = document.querySelector('[data-service-back]');
    const origin = storage.origin;
    if (link && valid(origin) && origin.destination === location.pathname) link.href = origin.url;
    let returning = false;
    const service = location.pathname;
    // Section links create history entries too. The page's Back control returns
    // to the previous page; the browser's own Back retains normal hash behavior.
    window.addEventListener('popstate', () => {
      if (returning && location.pathname === service) history.back();
    });
    window.addEventListener('pageshow', () => { returning = false; });
    link?.addEventListener('click', event => {
      if (!normalClick(event) || !internal || history.length < 2) return;
      event.preventDefault();
      if (returning) return;
      returning = true;
      history.back();
    });
  }
})();
