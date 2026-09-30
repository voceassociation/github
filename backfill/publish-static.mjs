import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const root=process.cwd();
const modulePath='/workspace/scratch/75d96a13572a/voce-render.mjs';
fs.writeFileSync(modulePath,fs.readFileSync('worker.js','utf8')+'\nexport { renderArticle, escapeHtml, firstLine };\n');
const {renderArticle,escapeHtml,firstLine}=await import(pathToFileURL(modulePath));
const corpus=JSON.parse(fs.readFileSync('data/corpus.json'));
const routes=JSON.parse(fs.readFileSync('data/article-routes.json'));
const byId=new Map(corpus.items.map(x=>[x.id,x]));
routes._corpusItems=corpus.items;
const files=[];
for(const route of routes.items){
 const item=byId.get(route.id);if(!item)throw Error('Missing '+route.id);
 const filename=route.path.slice(1)+'.html';
 fs.mkdirSync(path.dirname(filename),{recursive:true});
 const html=renderArticle(item,route,routes);
 const ld=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
 if(ld.articleBody!==item.text||ld.url!=='https://voce.life'+route.path)throw Error('Text/canonical mismatch');
 fs.writeFileSync(filename,html);files.push(filename);
}
let home=fs.readFileSync('archive.html','utf8');
const months=[...new Set(routes.items.map(x=>x.date.slice(0,7)))].sort().reverse();
home=home.replaceAll('17 indexed publications',`${corpus.item_count} archived publications`).replaceAll('17 publications indexées',`${corpus.item_count} publications archivées`).replaceAll('17 pubblicazioni indicizzate',`${corpus.item_count} pubblicazioni archiviate`);
fs.writeFileSync('archive.html',home);files.push('archive.html');
let sitemap=fs.readFileSync('sitemap.xml','utf8');
fs.writeFileSync('sitemap.xml',sitemap);files.push('backfill/publish-static.mjs');
const checkpoint=JSON.parse(fs.readFileSync('backfill/checkpoint.json'));
checkpoint.integration.static_pages_generated=routes.items.length;
checkpoint.integration.academy_catalogue='existing_curated_selection_plus_guide_no_bulk_listing';
checkpoint.integration.live_deployment='pending_verification';
fs.writeFileSync('backfill/checkpoint.json',JSON.stringify(checkpoint,null,2)+'\n');files.push('backfill/checkpoint.json');
const entries=files.map(filename=>({path:filename,mode:'100644',type:'blob',content:fs.readFileSync(filename,'utf8')}));
fs.writeFileSync('/workspace/scratch/75d96a13572a/voce-transfer.json',JSON.stringify(entries));
console.log(JSON.stringify({pages:routes.items.length,months,files:files.length,transfer_chars:JSON.stringify(entries).length,text_validation:'passed'}));
