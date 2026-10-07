'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const content = JSON.parse(fs.readFileSync(path.join(root, 'content/service-pages.json'), 'utf8'));
const measurements = JSON.parse(fs.readFileSync(path.join(root, 'content/service-metrics.json'), 'utf8'));
const base = 'https://mirwink.ru';
const slugs = ['ai-workspace', 'telegram', 'crm'];
const names = {'ai-workspace': 'AI Workspace', telegram: 'Telegram Services', crm: 'CRM'};
const seoTitles = {
  ru: {'ai-workspace':'AI-ассистенты и автоматизация — AI Workspace | MIRWINK',telegram:'Разработка Telegram-ботов и Mini Apps | MIRWINK',crm:'CRM: внедрение, настройка и интеграции | MIRWINK'},
  en: {'ai-workspace':'AI Assistants & Workflow Automation | MIRWINK',telegram:'Telegram Bot & Mini App Development | MIRWINK',crm:'CRM Implementation & Integrations | MIRWINK'},
};
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const localPath = (slug, lang) => `${lang === 'ru' ? '/ru' : ''}/services/${slug}`;
const copy = {
  ru: {
    back:'Назад', studio:'Студия', services:'Услуги', contact:'Обсудить проект', home:'Главная MIRWINK', theme:'Переключить тему', menu:'Меню', skip:'Перейти к содержанию',
    built:'Дизайн · Разработка', explore:'Как это работает', detail:'Подробнее об услуге',
    why:'Когда это нужно', whyTitle:'Уберите разрывы\nв ежедневной работе.',
    scenarios:'Практические сценарии', scenariosTitle:'Под вашу задачу.\nПод вашу команду.',
    scope:'Состав решения', scopeTitle:'Что входит\nв работу.',
    process:'Путь к запуску', processTitle:'От задачи\nдо рабочего процесса.',
    measure:'Результат в цифрах', measureTitle:'Эффект, который\nможно измерить.',
    measureIntro:'До запуска согласуем показатели и исходную точку. После — сравниваем сопоставимые периоды и фиксируем изменения. Значения появятся по итогам замеров.',
    before:'До внедрения', after:'После внедрения', period:'Период измерения', empty:'Значение пока не указано',
    faq:'Вопросы и ответы', faqTitle:'До начала\nработы.', related:'Связанные направления', relatedTitle:'Соедините\nследующий шаг.',
    end:'Давайте обсудим задачу', email:'Написать на почту', telegram:'Написать в Telegram', privacy:'Конфиденциальность и контакты',
    work:'Смотреть проекты студии', diagram:'Схема решения', source:'Источники', review:'Проверка человеком', action:'Следующее действие',
    ai:['Документы','База знаний','Рабочие инструменты','Вопрос команды','Ответ с источниками','Согласование → действие'],
    tg:['Клиент','Выбрать услугу','Оставить заявку','Бот / Mini App','Запрос принят','CRM / команда'],
    crm:['Входящие','В работе','Следующий шаг','Контакт + источник','История + ответственный','Задача + срок'],
    mini:'Выбираем сценарий. Связываем данные. Проверяем результат.',
  },
  en: {
    back:'Back', studio:'Studio', services:'Services', contact:'Start a project', home:'MIRWINK home', theme:'Switch theme', menu:'Menu', skip:'Skip to content',
    built:'Design · Development', explore:'See how it works', detail:'Explore service',
    why:'When it makes sense', whyTitle:'Close the gaps\nin everyday work.',
    scenarios:'Practical use cases', scenariosTitle:'Your challenge.\nYour team.',
    scope:'The scope', scopeTitle:'What we\nbuild together.',
    process:'The path to launch', processTitle:'From a task\nto a working flow.',
    measure:'Measuring the outcome', measureTitle:'Progress you\ncan measure.',
    measureIntro:'Before rollout, we agree the measures and baseline. Afterwards, we compare comparable periods and record the change. Values will follow the measurements.',
    before:'Before rollout', after:'After rollout', period:'Measurement period', empty:'Value not yet provided',
    faq:'Questions & answers', faqTitle:'Before\nwe begin.', related:'Connected services', relatedTitle:'Connect\nthe next step.',
    end:'Let’s discuss your task', email:'Send an email', telegram:'Talk on Telegram', privacy:'Privacy & contact',
    work:'Explore studio work', diagram:'Solution map', source:'Sources', review:'Human review', action:'Next action',
    ai:['Documents','Knowledge base','Work tools','Team question','Answer with sources','Approval → action'],
    tg:['Customer','Choose a service','Send a request','Bot / Mini App','Request received','CRM / team'],
    crm:['Incoming','In progress','Next step','Contact + source','History + owner','Task + due date'],
    mini:'Choose a workflow. Connect the data. Check the outcome.',
  },
};
const arrow = '<span aria-hidden="true">↗</span>';
function diagram(slug, t) {
  if (slug === 'ai-workspace') return `<div class="system-map ai-map"><div class="map-sources">${t.ai.slice(0,3).map(s=>`<span>${esc(s)}</span>`).join('')}</div><div class="map-connector" aria-hidden="true">↓</div><div class="map-core"><span class="mono">MIRWINK / AI</span><strong>Workspace<span class="status-dot" aria-hidden="true"></span></strong><div class="query-line"><span aria-hidden="true">↳</span> ${esc(t.ai[3])}</div><p>${esc(t.ai[4])}</p><div class="source-lines" aria-hidden="true"><i></i><i></i><i></i></div></div><div class="map-connector" aria-hidden="true">↓</div><div class="map-output">${esc(t.ai[5])}<span aria-hidden="true">↗</span></div></div>`;
  if (slug === 'telegram') return `<div class="system-map telegram-map"><div class="chat-head"><span class="chat-mark" aria-hidden="true">↗</span><div><strong>Telegram Services</strong><span class="mono">MIRWINK / BOT + MINI APP</span></div></div><div class="chat-bubble">${esc(t.tg[0])}<div class="source-lines" aria-hidden="true"><i></i><i></i></div></div><div class="chat-options"><span>${esc(t.tg[1])} <b aria-hidden="true">↗</b></span><span>${esc(t.tg[2])} <b aria-hidden="true">↗</b></span></div><div class="chat-bubble outgoing">${esc(t.tg[4])} <span aria-hidden="true">✓</span></div><div class="map-connector" aria-hidden="true">↓</div><div class="map-output">${esc(t.tg[5])}<span aria-hidden="true">↗</span></div></div>`;
  return `<div class="system-map crm-map"><div class="board-head"><span class="mono">MIRWINK / CRM</span><span aria-hidden="true">○ ○ ○</span></div><div class="kanban">${t.crm.slice(0,3).map((s,i)=>`<div class="kanban-column"><div class="kanban-label"><span class="status-dot" aria-hidden="true"></span>${esc(s)}</div><div class="lead-card"><span class="mono">${String(i+1).padStart(2,'0')}</span><strong>${esc(t.crm[i+3])}</strong><div class="source-lines" aria-hidden="true"><i></i><i></i></div><span class="card-bottom" aria-hidden="true">↗</span></div></div>`).join('')}</div><div class="board-flow" aria-hidden="true"><span></span>→<span></span>→<span></span></div><div class="map-output">${esc(t.mini)}</div></div>`;
}
function metric(item, measured, t, lang, index) {
  const values = [measured.before, measured.after];
  values.forEach(v => {if (v !== null && (!Number.isFinite(v) || v < 0 || (item.unit === '%' && v > 100))) throw new Error(`Invalid metric ${index}: ${v}`);});
  if (values.some(v=>v!==null) && !measured.period?.[lang]) throw new Error('Measured values require a period in both languages');
  const max = item.unit === '%' ? 100 : Math.max(1,...values.filter(v=>v!==null));
  const display = v => v === null ? `<span aria-label="${esc(t.empty)}">—</span>` : new Intl.NumberFormat(lang,{maximumFractionDigits:2}).format(v);
  return `<article class="metric-card"><span class="mono">${String(index+1).padStart(2,'0')} / ${esc(item.label)}</span><div class="metric-value">${display(measured.after)}<span class="metric-unit">${esc(item.unit)}</span></div><div class="metric-chart">${values.map((v,i)=>`<div class="metric-row"><div><span>${esc(i?t.after:t.before)}</span><span>${display(v)} ${esc(item.unit)}</span></div><div class="metric-track" aria-hidden="true">${v===null?'':`<span class="${i?'after':'before'}" style="width:${v/max*100}%"></span>`}</div></div>`).join('')}</div><p>${esc(item.method)}</p><div class="metric-period mono">${esc(t.period)} <span>${esc(measured.period?.[lang] || '—')}</span></div></article>`;
}
for (const slug of slugs) {
  for (const lang of ['en','ru']) {
    const c=content[slug]?.[lang];
    if (!c) throw new Error(`Missing copy: ${slug}/${lang}`);
    const t=copy[lang], route=localPath(slug,lang), url=base+route, home=lang==='ru'?'/ru':'/';
    const contact=`${home}?lang=${lang}&modal=contact`, canonicalEn=base+localPath(slug,'en'), canonicalRu=base+localPath(slug,'ru');
    const title = seoTitles[lang][slug];
    const org={'@type':'Organization','@id':base+'/#organization',name:'MIRWINK',alternateName:['Mirwink','Мирвинк'],url:base+'/',logo:base+'/favicon.png',email:'mirwink@mail.ru',sameAs:['https://t.me/mirwink'],contactPoint:{'@type':'ContactPoint',contactType:'sales',email:'mirwink@mail.ru',availableLanguage:['ru','en']}};
    const schema={'@context':'https://schema.org','@graph':[org,{'@type':'WebSite','@id':base+'/#website',url:base+'/',name:'MIRWINK',alternateName:['Mirwink','Мирвинк'],publisher:{'@id':base+'/#organization'},inLanguage:['en','ru']},{'@type':'WebPage','@id':url+'#webpage',url,name:title,description:c.description,inLanguage:lang,isPartOf:{'@id':base+'/#website'},about:{'@id':url+'#service'},breadcrumb:{'@id':url+'#breadcrumbs'}},{'@type':'Service','@id':url+'#service',name:`MIRWINK — ${c.title}`,alternateName:lang==='ru'?`Мирвинк — ${c.title}`:`Mirwink ${c.title}`,serviceType:c.title,description:c.description,url,provider:{'@id':base+'/#organization'},mainEntityOfPage:{'@id':url+'#webpage'}},{'@type':'BreadcrumbList','@id':url+'#breadcrumbs',itemListElement:[{'@type':'ListItem',position:1,name:'MIRWINK',item:base+home},{'@type':'ListItem',position:2,name:c.title,item:url}]}]};
    const sectionHead=(kicker,heading,intro='')=>`<div class="section-head"><p class="eyebrow">${esc(kicker)}</p><div><h2>${esc(heading).replace(/\n/g,'<br>')}</h2>${intro?`<p class="section-intro">${esc(intro)}</p>`:''}</div></div>`;
    const html=`<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#a1ffcb"><title>${esc(title)}</title><meta name="description" content="${esc(c.description)}"><meta name="robots" content="index,follow"><link rel="canonical" href="${url}"><link rel="alternate" hreflang="en" href="${canonicalEn}"><link rel="alternate" hreflang="ru" href="${canonicalRu}"><link rel="alternate" hreflang="x-default" href="${canonicalEn}"><meta property="og:type" content="website"><meta property="og:site_name" content="MIRWINK"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(c.description)}"><meta property="og:url" content="${url}"><meta property="og:locale" content="${lang==='ru'?'ru_RU':'en_US'}"><meta property="og:image" content="${base}/assets/miro/social.png"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48 64x64"><link rel="icon" href="/assets/miro/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="stylesheet" href="/services/service-pages.css?v=1"><script src="/services/service-pages.js?v=1" defer></script><script src="/service-navigation.js?v=1" defer></script><script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script></head>
<body class="service-page service-${slug}"><a class="skip-link" href="#main">${t.skip}</a><header class="site-header"><a class="brand-symbol" href="${home}?lang=${lang}" aria-label="${t.home}">M</a><a class="wordmark" href="${home}?lang=${lang}">MIRWINK<span>${t.built}</span></a><nav class="desktop-nav" aria-label="${t.services}">${slugs.map(s=>`<a href="${localPath(s,lang)}"${s===slug?' aria-current="page"':''}>${names[s]}</a>`).join('')}</nav><div class="header-tools"><button class="theme-switch" type="button" aria-label="${t.theme}" aria-pressed="false"><span aria-hidden="true">◐</span></button><nav class="language-switch" aria-label="${lang==='ru'?'Выбор языка':'Language'}"><a href="${localPath(slug,'en')}" lang="en" hreflang="en"${lang==='en'?' aria-current="page"':''}>EN</a><a href="${localPath(slug,'ru')}" lang="ru" hreflang="ru"${lang==='ru'?' aria-current="page"':''}>RU</a></nav><a class="header-cta" href="${contact}">${t.contact}${arrow}</a><button class="menu-toggle" aria-expanded="false" aria-controls="mobile-menu" type="button">${t.menu}<span aria-hidden="true">+</span></button></div></header><nav id="mobile-menu" class="mobile-menu" aria-label="${t.services}" hidden>${slugs.map(s=>`<a href="${localPath(s,lang)}"${s===slug?' aria-current="page"':''}>${names[s]}${arrow}</a>`).join('')}<a href="${contact}">${t.contact}${arrow}</a></nav>
<div class="service-backbar"><a href="${home}?lang=${lang}#clients" data-service-back><span aria-hidden="true">←</span> ${t.back}</a></div><main id="main"><section class="hero"><div class="hero-heading"><div class="hero-meta mono"><a href="${home}?lang=${lang}">MIRWINK</a><span>/ ${t.services}</span><span>0${slugs.indexOf(slug)+1}</span></div><h1>${names[slug]==='CRM'?'CRM<span class="hero-plus" aria-hidden="true">+</span>':names[slug].split(' ').map(esc).join('<br>')}</h1><p class="hero-kicker mono">${esc(c.kicker)}</p></div><div class="hero-visual"><span class="visual-label mono">${t.diagram} / ${names[slug]}</span>${diagram(slug,t)}</div><div class="hero-statement"><h2>${esc(c.headline).replace(/\n/g,'<br>')}</h2><a class="text-link" href="${contact}">${t.contact}${arrow}</a></div><div class="hero-summary"><p>${esc(c.description)}</p><a class="text-link" href="#scenarios">${t.explore}<span aria-hidden="true">↓</span></a></div></section>
<div class="service-strip" aria-label="${esc(c.kicker)}"><span>${esc(c.kicker)}</span><span aria-hidden="true">MIRWINK ↗</span></div>
<section class="section" id="challenges">${sectionHead(t.why,t.whyTitle)}<div class="problem-grid">${c.problems.map((v,i)=>`<article class="problem-card"><span class="mono">${String(i+1).padStart(2,'0')} /</span><h3>${esc(v.title)}</h3><p>${esc(v.text)}</p></article>`).join('')}</div></section>
<section class="section scenarios-section" id="scenarios">${sectionHead(t.scenarios,t.scenariosTitle)}<div class="scenario-list">${c.scenarios.map((v,i)=>`<article class="scenario"><span class="scenario-index">0${i+1}</span><h3>${esc(v.title)}</h3><p>${esc(v.text)}</p><span class="scenario-arrow" aria-hidden="true">↗</span></article>`).join('')}</div></section>
<section class="section" id="scope">${sectionHead(t.scope,t.scopeTitle)}<div class="deliverable-grid">${c.deliverables.map((v,i)=>`<article class="deliverable"><span class="delivery-mark" aria-hidden="true">${['↗','⊞','↔','↳','⊕','✓'][i%6]}</span><h3>${esc(v.title)}</h3><p>${esc(v.text)}</p></article>`).join('')}</div></section>
<section class="section process-section" id="process">${sectionHead(t.process,t.processTitle)}<ol class="process-grid">${c.process.map((v,i)=>`<li><span class="process-number" aria-hidden="true">0${i+1}</span><h3>${esc(v.title)}</h3><p>${esc(v.text)}</p><span class="process-arrow" aria-hidden="true">${i===c.process.length-1?'✓':'→'}</span></li>`).join('')}</ol></section>
<section class="section metrics-section" id="metrics">${sectionHead(t.measure,t.measureTitle,t.measureIntro)}<div class="metrics-grid">${c.metrics.map((item,i)=>metric(item,measurements[slug][i],t,lang,i)).join('')}</div></section>
<section class="section faq-section" id="faq">${sectionHead(t.faq,t.faqTitle)}<div class="faq-list">${c.faq.map((v,i)=>`<details><summary><span class="mono">0${i+1}</span><h3>${esc(v.q)}</h3><span class="faq-plus" aria-hidden="true">+</span></summary><p>${esc(v.a)}</p></details>`).join('')}</div></section>
<section class="section related-section">${sectionHead(t.related,t.relatedTitle)}<div class="related-grid">${slugs.filter(s=>s!==slug).map(s=>`<a href="${localPath(s,lang)}"><span class="mono">${t.detail}</span><h3>${names[s]}</h3>${arrow}</a>`).join('')}</div></section>
<section class="contact-section" id="contact"><p class="eyebrow">${t.end}</p><h2>${esc(c.ctaTitle)}</h2><div class="contact-bottom"><p>${esc(c.ctaText)}</p><div><a class="button button-dark" href="${contact}">${t.contact}${arrow}</a><a class="text-link" href="mailto:mirwink@mail.ru">mirwink@mail.ru${arrow}</a><a class="text-link" href="https://t.me/mirwink" target="_blank" rel="noopener noreferrer">${t.telegram}${arrow}</a></div></div></section></main>
<footer class="site-footer"><a class="footer-brand" href="${home}?lang=${lang}">Mirwink</a><div class="footer-grid"><p class="mono">© 2026 MIRWINK<br>${t.built}</p><nav aria-label="${t.services}">${slugs.map(s=>`<a href="${localPath(s,lang)}">${names[s]}</a>`).join('')}</nav><nav aria-label="${t.studio}"><a href="${home}?lang=${lang}#clients">${t.work}${arrow}</a><a href="${home}?lang=${lang}&modal=privacy">${t.privacy}</a><a href="mailto:mirwink@mail.ru">mirwink@mail.ru</a></nav></div></footer></body></html>`;
    const dir=path.join(root,route.slice(1));fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'index.html'),html);
    console.log(`Generated ${route} (${Buffer.byteLength(html)} bytes)`);
  }
}
