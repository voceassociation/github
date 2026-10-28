// Run: node render_draft.mjs /tmp/ai019-preview.html
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../../../..');
const out=path.resolve(process.argv[2]);
if(out===root||out.startsWith(root+path.sep))throw Error('Preview must be outside repository');
const chapters=fs.readdirSync(here).filter(f=>/^\d\d-.*\.html$/.test(f)).sort().map(f=>fs.readFileSync(path.join(here,f),'utf8')).join('');
const refs=fs.readFileSync(path.join(here,'references.html'),'utf8');
const shell=fs.readFileSync(path.join(root,'cours/voce-ai-019.html'),'utf8');
const html=shell.replace(/(<article\b[^>]*>)[\s\S]*?(<\/article>)/,(m,a,b)=>a+'<h1>FlashAttention et la circulation des données</h1><p>Brouillon incomplet, non publié.</p>'+chapters+refs+b).replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/g,'').replace(/<meta\b[^>]*name=["']robots["'][^>]*>/g,'').replace('</head>','<meta name="robots" content="noindex,nofollow"></head>');
fs.writeFileSync(out,html);

