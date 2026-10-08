/* Matches the homepage AnimatedText: 1 s, cubic-bezier(.23,1,.32,1),
 * 100 ms line stagger, 100% line / 8 px block offset, -10% viewport margin. */
(() => {
  'use strict';
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const historyVisit = document.documentElement.dataset.mirwinkHistory;
  if (motion.matches || historyVisit || !('IntersectionObserver' in window)) return;
  const selector = document.body.classList.contains('service-page')
    ? 'main h1, main h2, main h3, main p, main .eyebrow, main .system-map, main .metric-chart, main .metric-value, main .process-number'
    : 'main h1, main h2, main h3, main p, main .eyebrow';
  const pending = new Set();
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target;
      observer.unobserve(el);
      pending.delete(el);
      el.dataset.revealState = 'shown';
    }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0 });
  for (const el of document.querySelectorAll(selector)) {
    // Hero content, disclosure answers, forms and live results stay visible.
    // Never split measured text nodes or change layout while scrolling.
    if (el.closest('.hero, [class$="-hero"], details, form, [aria-live], dialog') ||
        !el.getClientRects().length || el.getBoundingClientRect().top < innerHeight) continue;
    el.dataset.revealState = 'pending';
    el.classList.add('scroll-reveal');
    if (/^H[123]$/.test(el.tagName)) {
      el.classList.add('scroll-reveal-heading');
      // Existing explicit <br> breaks can be masked without measuring fonts or
      // changing the wrapping. Natural multiline headings use the block effect.
      if (el.querySelector('br') && !el.querySelector('a, button, input')) {
        const groups = [[]];
        for (const node of [...el.childNodes]) {
          if (node.nodeName === 'BR') { groups.push([]); node.remove(); }
          else groups[groups.length - 1].push(node);
        }
        groups.forEach((nodes, i) => {
          const mask = document.createElement('span'); mask.className = 'reveal-mask';
          const line = document.createElement('span'); line.className = 'reveal-line';
          line.style.setProperty('--reveal-delay', `${i * 100}ms`);
          line.append(...nodes); mask.append(line); el.append(mask);
        });
        el.classList.add('scroll-reveal-lines');
      }
    }
    pending.add(el); observer.observe(el);
  }
  const showAll = () => {
    observer.disconnect();
    for (const el of pending) el.dataset.revealState = 'shown';
    pending.clear();
    document.documentElement.dataset.revealMotion = 'off';
  };
  // Focusing links or text inside an element must never leave it invisible.
  document.addEventListener('focusin', event => {
    const el = event.target.closest?.('.scroll-reveal');
    if (el) { el.dataset.revealState = 'shown'; pending.delete(el); observer.unobserve(el); }
  });
  motion.addEventListener('change', event => { if (event.matches) showAll(); });
  window.addEventListener('pageshow', event => { if (event.persisted) showAll(); });
})();
