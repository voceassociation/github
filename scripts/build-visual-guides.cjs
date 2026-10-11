const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'visual-guides.js'),'utf8');
const context={};vm.createContext(context);
vm.runInContext(source.replace("  const entries = document.querySelectorAll('[data-voce-diagram]');","  globalThis.guides=GUIDES;globalThis.ui=UI;return;"),context);
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify({guides:context.guides,ui:context.ui},null,2));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const metadata={
 en:{title:'VOCE visual guides',intro:'Choose a question, open its diagram and follow the links to the full framework. PNG summaries and detailed PDF guides are available in the selected language for sharing.',text:'Read the text version',human:'Human responsibility',skip:'Skip to content',main:'Main navigation',language:'Language',home:'Home'},
 fr:{title:'VOCE en schémas',intro:'Choisissez une question, ouvrez son schéma et suivez les liens vers le référentiel complet. Les synthèses PNG et les guides PDF détaillés sont disponibles dans la langue choisie pour être partagés.',text:'Lire la version texte',human:'Responsabilité humaine',skip:'Aller au contenu',main:'Navigation principale',language:'Langue',home:'Accueil'},
 it:{title:'VOCE in schemi',intro:'Scegli una domanda, apri lo schema e segui i link al quadro completo. Le sintesi PNG e le guide PDF dettagliate sono disponibili nella lingua scelta per la condivisione.',text:'Leggi la versione testuale',human:'Responsabilità umana',skip:'Vai al contenuto',main:'Navigazione principale',language:'Lingua',home:'Home'}
};
const localized=new Set(['agent-infrastructure','agent-conformance','argos','human-cognitive-assurance','governance','atlas','visual-guides']);
const route=(r,l)=>r.startsWith('#')?'/'+r:((l!=='en'&&localized.has(r.split('#')[0]))?'/'+l:'')+'/'+r;
for(const l of ['en','fr','it']){
 const prefix=l==='en'?'':l+'/',url='https://voce.life/'+prefix+'visual-guides',m=metadata[l],ui=context.ui[l];
 const template=fs.readFileSync(path.join(root,prefix+'agent-infrastructure.html'),'utf8');
 let header=template.match(/<header>.*?<\/header>/s)[0];
 const langlinks=['en','fr','it'].map(code=>'<a href="'+(code==='en'?'':'/'+code)+'/visual-guides"'+(code===l?' class="active" aria-current="page"':'')+'>'+code.toUpperCase()+'</a>').join('');
 header=header.replace(/(<span class="lang"[^>]*>).*?<\/span>/s,'$1'+langlinks+'</span>');
 const footer=template.match(/<footer>.*?<\/footer>/s)[0];
 const articles=Object.entries(context.guides).map(([key,g])=>{
  const c=g[l];
  const stages=c.stages.map((s,i)=>'<li><h3>'+(g.type==='levels'?'A'+i+' · ':'')+esc(s[0])+'</h3><p>'+esc(s[1])+'</p>'+(s[2]?'<p>'+esc(m.human)+': '+esc(s[2])+'</p>':'')+'</li>').join('');
  const proof=g.proof?'<h3>'+esc(ui.proof)+'</h3><ul>'+ui.states.map(s=>'<li><strong>'+esc(s[0])+'</strong>: '+esc(s[1])+'</li>').join('')+'</ul>':'';
  return '<article class="vg-library-item" id="'+key+'"><h2>'+esc(c.title)+'</h2><p>'+esc(c.intro)+'</p><a class="voce-visual-open" href="#'+key+'-text" data-voce-diagram="'+key+'">'+esc(ui.open)+'</a><details class="vg-text"><summary>'+esc(m.text)+'</summary><div id="'+key+'-text"><ol>'+stages+'</ol>'+proof+'<p>'+esc(c.boundary)+'</p><div class="vg-library-links">'+c.actions.map(a=>'<a href="'+esc(route(a[1],l))+'">'+esc(a[0])+'</a>').join('')+'</div><p class="vg-source">'+esc(ui.source)+'</p></div></details></article>';
 }).join('\n');
 const schema={'@context':'https://schema.org','@type':'CollectionPage',name:m.title,url,inLanguage:l,datePublished:'2026-10-11',dateModified:'2026-10-11',publisher:{'@type':'Organization',name:'VOCE Association',url:'https://voce.life/'},mainEntity:{'@type':'ItemList',itemListElement:Object.entries(context.guides).map(([key,g],i)=>({'@type':'ListItem',position:i+1,name:g[l].title,url:url+'#'+key}))}};
 const html='<!doctype html>\n<html lang="'+l+'">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>'+esc(m.title)+' | VOCE</title>\n<meta name="description" content="'+esc(m.intro)+'">\n<meta name="robots" content="index,follow,max-image-preview:large">\n<link rel="canonical" href="'+url+'">\n'+['en','fr','it','x-default'].map(code=>'<link rel="alternate" hreflang="'+code+'" href="https://voce.life/'+(['en','x-default'].includes(code)?'':code+'/')+'visual-guides">').join('\n')+'\n<link rel="icon" href="/favicon.svg" type="image/svg+xml">\n<meta property="og:type" content="website"><meta property="og:site_name" content="VOCE">\n<meta property="og:title" content="'+esc(m.title)+' | VOCE"><meta property="og:description" content="'+esc(m.intro)+'"><meta property="og:url" content="'+url+'"><meta property="og:image" content="https://voce.life/voce-og.jpg">\n<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="https://voce.life/voce-og.jpg">\n<meta name="theme-color" content="#fbfaf6">\n<script type="application/ld+json">'+JSON.stringify(schema)+'</script>\n<link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/visual-guides.css?v=20261011">\n</head>\n<body>\n<a class="skip-link" href="#main-content">'+esc(m.skip)+'</a>\n'+header+'\n<main id="main-content"><section class="topic-hero"><div class="wrap"><div class="topic-kicker">VOCE</div><h1 class="topic-title">'+esc(m.title)+'</h1><p class="topic-deck">'+esc(m.intro)+'</p></div></section>\n<div class="wrap"><section class="vg-library" aria-label="'+esc(m.title)+'">\n'+articles+'\n</section></div></main>\n'+footer+'\n<script src="/visual-guides.js?v=20261011" defer></script>\n</body></html>\n';
 fs.writeFileSync(path.join(root,prefix+'visual-guides.html'),html);
}
const pageMap={'governance':'overview','atlas':'atlas','archive':'academy-research','research':'academy-research','sovereignty':'sovereignty','light-workforce':'light-workforce','technoference':'technoference','art':'art','about':'method','standards':'method'};
const changed=[];
for(const [page,key] of Object.entries(pageMap)){
 for(const prefix of ['','fr/','it/']){
  const p=path.join(root,prefix+page+'.html');if(!fs.existsSync(p))continue;
  let s=fs.readFileSync(p,'utf8');if(s.includes('data-voce-diagram'))continue;
  const l=prefix?prefix.slice(0,2):'en';
  s=s.replace(/(<link[^>]+href="\/styles\.css(?:\?[^"]*)?"[^>]*>)/,'$1\n<link rel="stylesheet" href="/visual-guides.css?v=20261011">');
  const entry='<p class="voce-visual-entry"><a class="voce-visual-open" href="'+route('visual-guides',l)+'#'+key+'" data-voce-diagram="'+key+'">'+esc(context.ui[l].open)+'</a></p>';
  const deck=/(<p class="topic-deck"[^>]*>.*?<\/p>)/s;
  if(!deck.test(s))throw new Error('Missing introduction: '+p);
  s=s.replace(deck,'$1\n'+entry);
  s=s.replace('</body>','<script src="/visual-guides.js?v=20261011" defer></script>\n</body>');
  s=s.replace(/"dateModified":"2026-\d{2}-\d{2}"/g,'"dateModified":"2026-10-11"');
  fs.writeFileSync(p,s);changed.push(prefix+page+'.html');
 }
}
const sitemapPath=path.join(root,'sitemap.xml');let sitemap=fs.readFileSync(sitemapPath,'utf8');
for(const l of ['en','fr','it']){
 const url='https://voce.life/'+(l==='en'?'':l+'/')+'visual-guides';
 if(!sitemap.includes('<loc>'+url+'</loc>'))sitemap=sitemap.replace('</urlset>','<url><loc>'+url+'</loc><lastmod>2026-10-11</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>\n</urlset>');
}
fs.writeFileSync(sitemapPath,sitemap);
console.log(JSON.stringify({guides:Object.keys(context.guides).length,languages:Object.keys(metadata),newPages:3,additionalPages:changed}));
