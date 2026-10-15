import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {COPY} from '../legis-copy.js';
import {HELP_COPY,HELP_ROUTES} from '../legis-help-content.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/legis-sources.json'),'utf8'));
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
for(const lang of ['en','fr','it']) {
  const t=COPY[lang],prefix=lang==='en'?'':'/'+lang,url='https://voce.life'+prefix+'/legis';
  const schema={'@context':'https://schema.org','@type':'SoftwareApplication',name:'LEGIS',applicationCategory:'BusinessApplication',operatingSystem:'Web',softwareVersion:'0.1.0',description:t.description,url,inLanguage:lang,datePublished:'2026-10-14',publisher:{'@type':'Organization',name:'VOCE Association',url:'https://voce.life/'}};
  const options=(values,labels)=>values.map((v,i)=>`<option value="${v}">${esc(labels[i])}</option>`).join('');
  const sources=catalog.sources.map(s=>`<li id="source-${s.id}"><div class="legis-reference-label">${esc(s.reference)}</div><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title[lang])}</a><small>${esc(s.publisher)} · ${esc(t.checked)}: ${s.checked_at}</small></li>`).join('');
  const html=`<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(t.title)}</title><meta name="description" content="${esc(t.description)}">
<meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${url}">
<link rel="alternate" hreflang="en" href="https://voce.life/legis"><link rel="alternate" hreflang="fr" href="https://voce.life/fr/legis"><link rel="alternate" hreflang="it" href="https://voce.life/it/legis"><link rel="alternate" hreflang="x-default" href="https://voce.life/legis">
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/legis.css?v=20261015">
<meta property="og:type" content="website"><meta property="og:site_name" content="VOCE"><meta property="og:title" content="${esc(t.title)}"><meta property="og:description" content="${esc(t.description)}"><meta property="og:url" content="${url}"><meta property="og:image" content="https://voce.life/voce-og.jpg"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(t.title)}"><meta name="twitter:description" content="${esc(t.description)}"><meta name="twitter:image" content="https://voce.life/voce-og.jpg"><meta name="theme-color" content="#123e33">
<script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script>
</head>
<body class="legis-page">
<a class="skip-link" href="#main-content">${esc(t.skip)}</a>
<header><div class="wrap nav"><a class="voce-mark" href="/" aria-label="VOCE"><span>VOCE</span></a><nav class="menu" aria-label="VOCE"><a href="/">${esc(t.home)}</a><a href="/archive">${t.academy}</a><a href="${prefix}/governance">${t.governance}</a><a href="${prefix}/visual-guides">${t.visuals}</a><span class="lang" role="group" aria-label="Language"><a href="/legis" ${lang==='en'?'class="active" aria-current="page"':''}>EN</a><a href="/fr/legis" ${lang==='fr'?'class="active" aria-current="page"':''}>FR</a><a href="/it/legis" ${lang==='it'?'class="active" aria-current="page"':''}>IT</a></span></nav></div></header>
<main id="main-content">
<aside class="legis-public-entry"><div class="wrap"><span>${esc(HELP_COPY[lang].proBanner)}</span><a href="${HELP_ROUTES[lang]}">${esc(HELP_COPY[lang].proBannerLink)} ↗</a></div></aside>
<section class="legis-hero"><div class="wrap legis-hero-grid"><div><p class="legis-kicker">${t.kicker}</p><h1>${t.headline}</h1><p class="legis-deck">${t.deck}</p><div class="legis-actions"><a class="legis-button" href="#workshop">${t.open}</a><button class="legis-link" type="button" data-legis-example>${t.example}</button></div></div><aside class="legis-scope"><h2>${t.scope}</h2><p>${t.scopeText}</p><p>${t.phase}</p><span>FR / EN / IT</span></aside></div></section>
<section class="legis-section" id="workshop"><div class="wrap"><div class="legis-section-head"><p class="legis-kicker">LEGIS</p><h2>${t.workshop}</h2><p>${t.workshopText}</p></div>
<div class="legis-workspace">
<div class="legis-input-panel"><form id="legis-form">
<div class="legis-fields"><div><label for="legis-workflow">${t.workflow}</label><select id="legis-workflow" name="workflow">${options(['ticketing','data','clauses'],t.flows)}</select></div><div><label for="legis-institution">${t.institution}</label><select id="legis-institution" name="institution">${options(['unknown','public','private'],t.statuses)}</select><small>${t.statusNote}</small></div></div>
<p class="legis-jurisdiction">${t.jurisdiction}: ${t.jurisdictionValue}</p>
<label for="legis-question">${t.question}</label><textarea id="legis-question" name="question" rows="4" minlength="8" maxlength="900" required placeholder="${esc(t.questionPlaceholder)}"></textarea>
<label for="legis-clause">${t.clause}</label><textarea id="legis-clause" name="clause" rows="5" maxlength="3200" placeholder="${esc(t.clausePlaceholder)}"></textarea>
<div class="legis-actions"><button class="legis-button" type="submit" id="legis-prepare" disabled>${t.prepare}</button><button class="legis-link" id="legis-clear" type="button">${t.clear}</button></div>
</form>
<div class="legis-ai-panel"><h3>${t.aiTitle}</h3><p>${t.aiLead}</p><label for="legis-model">${t.model}</label><select id="legis-model">${options(['glm','qwen','compare'],t.models)}</select><label class="legis-consent" for="legis-consent"><input id="legis-consent" type="checkbox"><span>${t.consent}</span></label><button class="legis-button" type="button" id="legis-analyse" disabled>${t.analyse}</button><p class="legis-service" id="legis-service" role="status"></p><details class="legis-privacy"><summary>${lang==='fr'?'Traitement des données':lang==='it'?'Trattamento dei dati':'Data processing'}</summary><p>${t.privacy}</p><a href="https://developers.cloudflare.com/workers-ai/platform/data-usage/" target="_blank" rel="noopener noreferrer">Cloudflare Workers AI</a></details></div></div>
<div class="legis-output-panel"><div class="legis-empty" id="legis-empty"><span>LEGIS</span><p>${t.initial}</p></div><div id="legis-result" hidden><div class="legis-result-heading"><div><span class="legis-kicker">${t.noteLabel}</span><h3>${t.noteTitle}</h3></div><div class="legis-output-actions"><button type="button" class="legis-link" id="legis-export">${t.export}</button><button type="button" class="legis-link" id="legis-print">${t.print}</button></div></div><div id="legis-grid"></div><div id="legis-readings"></div></div><p class="legis-message" id="legis-message" role="status" aria-live="polite"></p></div>
</div>
</div></section>
<section class="legis-section"><div class="wrap legis-evidence"><div><h2>${t.sourcesTitle}</h2><p>${t.sourcesLead}</p><details class="legis-pathway"><summary>${t.method}</summary><ol>${t.steps.map((s,i)=>`<li><span>0${i+1}</span>${s}</li>`).join('')}</ol></details><article class="legis-demo"><h3>${t.demoTitle}</h3><p>${t.demoText}</p><button type="button" class="legis-link" data-legis-example>${t.example}</button></article></div><ol class="legis-source-list">${sources}</ol></div></section>
<section class="legis-section"><div class="wrap legis-faq"><h2>${t.faqTitle}</h2><div>${[1,2,3].map(n=>`<details><summary>${t['faq'+n]}</summary><p>${t['faq'+n+'Text']}</p></details>`).join('')}</div></div></section>
</main><footer class="legis-footer"><div class="wrap"><p>${t.footer}</p><a href="mailto:voceassociation@gmail.com?subject=LEGIS%20beta">${t.contact}</a></div></footer>
<section id="legis-print-area" aria-hidden="true"></section>
<script type="module" src="/legis-ui.js?v=20261014"></script>
</body></html>
`;
  const file=path.join(root,lang==='en'?'legis.html':lang+'/legis.html');
  fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,html);
  console.log(path.relative(root,file));
}
