(()=>{
'use strict';
if(!window.matchMedia('(min-width: 1200px)').matches)return;
const lang=(document.documentElement.lang||'en').toLowerCase().startsWith('ru')?'ru':'en';
const path=location.pathname;
let enHref='/',ruHref='/ru/';
const demo=path.match(/^\/demos\/(ember|forma|line)\/(?:index\.html|en\.html)?$/);
if(demo){enHref=`/demos/${demo[1]}/en.html`;ruHref=`/demos/${demo[1]}/index.html`;}
const nav=document.createElement('nav');
nav.className='miro-lang-switch';
nav.setAttribute('aria-label',lang==='ru'?'Выбор языка':'Language');
const make=(code,href,label)=>{const a=document.createElement('a');a.href=href+(location.hash||'');a.textContent=label;a.lang=code;a.hreflang=code;if(code===lang){a.setAttribute('aria-current','page');a.addEventListener('click',e=>e.preventDefault());}return a};
nav.append(make('en',enHref,'EN'),make('ru',ruHref,'RU'));
document.body.append(nav);
})();
