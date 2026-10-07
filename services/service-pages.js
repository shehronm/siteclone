(() => {
  'use strict';
  const themeButton = document.querySelector('.theme-switch');
  const menuButton = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#mobile-menu');
  const applyTheme = dark => {
    document.documentElement.classList.toggle('dark', dark);
    themeButton?.setAttribute('aria-pressed', String(dark));
  };
  try { applyTheme(localStorage.getItem('mirwink-service-theme') === 'dark'); } catch {}
  themeButton?.addEventListener('click', () => {
    const dark = !document.documentElement.classList.contains('dark');
    applyTheme(dark);
    try { localStorage.setItem('mirwink-service-theme', dark ? 'dark' : 'light'); } catch {}
  });
  const closeMenu = () => {menu.hidden = true; menuButton.setAttribute('aria-expanded', 'false');};
  menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menu.hidden = !open;menuButton.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('keydown', event => {if (event.key === 'Escape' && !menu.hidden) {closeMenu();menuButton.focus();}});
  menu?.addEventListener('click', event => {if (event.target.closest('a')) closeMenu();});
})();
