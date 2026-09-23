(()=>{
'use strict';

const MIN_DESKTOP=1200;
const lang=(document.documentElement.lang||'en').toLowerCase().startsWith('ru')?'ru':'en';
const path=location.pathname;
let enHref='/',ruHref='/ru/';
const demo=path.match(/^\/demos\/(ember|forma|line)\/(?:index\.html|en\.html)?$/);
if(demo){
  enHref=`/demos/${demo[1]}/en.html`;
  ruHref=`/demos/${demo[1]}/index.html`;
}

const makeLink=(code,href,label)=>{
  const a=document.createElement('a');
  a.href=href+(location.hash||'');
  a.textContent=label;
  a.lang=code;
  a.hreflang=code;
  if(code===lang){
    a.setAttribute('aria-current','page');
    a.addEventListener('click',e=>e.preventDefault());
  }
  return a;
};

const buildNav=(extraClass)=>{
  const nav=document.createElement('nav');
  nav.className=`miro-lang-switch ${extraClass}`;
  nav.setAttribute('aria-label',lang==='ru'?'Выбор языка':'Language');
  nav.append(makeLink('en',enHref,'EN'),makeLink('ru',ruHref,'RU'));
  return nav;
};

const findThemeButton=()=>{
  const header=document.querySelector('header');
  if(!header)return null;
  return header.querySelector('button[title="Переключить тему"]') ||
    header.querySelector('button[title="Toggle theme"]') ||
    header.querySelector('button[aria-label="Переключить тему"]') ||
    header.querySelector('button[aria-label="Toggle theme"]') ||
    header.querySelector('button:has(svg[viewBox="0 0 24 12"])');
};

const removeMainNav=()=>{
  document.querySelectorAll('.miro-lang-switch--header').forEach(n=>n.remove());
};

const ensure=()=>{
  const isDesktop=window.innerWidth>=MIN_DESKTOP;

  // Project/demo pages: keep language control inside their reserved top bar.
  const demoBar=document.querySelector('.demo-bar');
  if(demoBar){
    let nav=demoBar.querySelector('.miro-lang-switch--demo');
    if(!nav){
      nav=buildNav('miro-lang-switch--demo');
      demoBar.append(nav);
    }
    nav.hidden=!isDesktop;
    return;
  }

  if(!isDesktop){
    removeMainNav();
    return;
  }

  const themeButton=findThemeButton();
  if(!themeButton || !themeButton.parentElement)return;

  let nav=document.querySelector('.miro-lang-switch--header');
  if(!nav)nav=buildNav('miro-lang-switch--header');

  // React can replace the header during hydration. Always put the control back
  // immediately after the CURRENT theme button if its parent changed.
  if(nav.parentElement!==themeButton.parentElement || nav.previousElementSibling!==themeButton){
    themeButton.insertAdjacentElement('afterend',nav);
  }
  nav.hidden=false;
};

let scheduled=false;
const schedule=()=>{
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;ensure();});
};

// Run immediately, keep observing hydration, and use a short bootstrap interval
// as a final guard against streamed React nodes appearing between mutations.
ensure();
const observer=new MutationObserver(schedule);
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('load',schedule,{once:true});
window.addEventListener('pageshow',schedule);
window.addEventListener('resize',schedule,{passive:true});
let ticks=0;
const bootstrap=setInterval(()=>{
  ensure();
  if(++ticks>=80)clearInterval(bootstrap);
},250);
})();
