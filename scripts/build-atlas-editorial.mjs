import fs from 'node:fs';
import {ATLAS_EDITORIAL_COPY,ATLAS_PRESENTATION_UPDATED_AT,renderAtlasDossiers} from '../atlas-editorial.js';
const esc = value => value.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
const atlas = JSON.parse(fs.readFileSync(new URL('../data/atlas.json',import.meta.url),'utf8'));
for (const [lang,ui] of Object.entries(ATLAS_EDITORIAL_COPY)) {
  const file = new URL(`../${lang === 'en' ? '' : `${lang}/`}atlas.html`,import.meta.url);
  let html = fs.readFileSync(file,'utf8');
  html = html.replace(/<title>[^<]*<\/title>/,`<title>${ui.title}</title>`)
    .replace(/(<meta (?:name="description"|property="og:description"|name="twitter:description") content=")[^"]*(">)/g,`$1${esc(ui.description)}$2`)
    .replace(/(<meta (?:property="og:title"|name="twitter:title") content=")[^"]*(">)/g,`$1${esc(ui.title)}$2`)
    .replace(/(<div class="topic-kicker">)[^<]*(<\/div>)/,`$1${ui.kicker}$2`)
    .replace(/(<h1 class="topic-title">)[^<]*(<\/h1>)/,`$1${ui.heading}$2`)
    .replace(/(<p class="topic-deck">)[^<]*(<\/p>)/,`$1${ui.deck}$2`);
  if (!html.includes('href="/atlas-editorial.css')) html = html.replace('<link rel="stylesheet" href="/styles.css">','<link rel="stylesheet" href="/styles.css">\n<link rel="stylesheet" href="/atlas-editorial.css?v=20261016">');
  const section = `<!-- atlas-editorial:start -->\n${renderAtlasDossiers(lang)}\n<!-- atlas-editorial:end -->\n`;
  html = /<!-- atlas-editorial:start -->[\s\S]*?<!-- atlas-editorial:end -->\n?/.test(html)
    ? html.replace(/<!-- atlas-editorial:start -->[\s\S]*?<!-- atlas-editorial:end -->\n?/,section)
    : html.replace('<section class="atlas-shell-section">',section+'\n<section class="atlas-shell-section">');
  html = html.replace(/(<div class="atlas-pathfinder")(?! id=)/,'$1 id="atlas-pathfinder"');
  html = html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,(all,json) => {
    const ld = JSON.parse(json);
    if (ld['@type'] === 'CollectionPage') {ld.dateModified=ATLAS_PRESENTATION_UPDATED_AT;ld.description=ui.description;}
    if (ld['@type'] === 'Dataset') ld.dateModified=atlas.generated_at;
    return `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g,'\\u003c')}</script>`;
  });
  fs.writeFileSync(file,html);
}
