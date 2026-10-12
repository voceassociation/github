// Rebuild public downloads with the same renderer used by the site's dialog.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const {pathToFileURL}=require('url');
const {createCanvas,GlobalFonts}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'..'),fonts=process.argv[2];
if(!fonts)throw new Error('Pass a directory containing CormorantGaramond.ttf and Inter.ttf');
for(const [file,name] of [['CormorantGaramond.ttf','Cormorant Garamond'],['Inter.ttf','Inter']]){
 if(!GlobalFonts.registerFromPath(path.join(fonts,file),name))throw new Error('Missing exact font: '+name);
}
const source=fs.readFileSync(path.join(root,'visual-guides.js'),'utf8'),context={};vm.createContext(context);
vm.runInContext(source.replace("  const entries = document.querySelectorAll('[data-voce-diagram]');","  globalThis.guides=GUIDES;globalThis.ui=UI;return;"),context);
if(!context.guides||Object.keys(context.guides).length!==16)throw new Error('Review guide set before publishing');
global.document={fonts:{ready:Promise.resolve(),load:async()=>[]},createElement:tag=>{
 if(tag!=='canvas')throw new Error('Unexpected export element');
 const c=createCanvas(1200,1500);
 c.toBlob=(cb,type)=>cb(new Blob([c.toBuffer(type==='image/jpeg'?'image/jpeg':'image/png')],{type}));return c;
}};
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const renderer=await import(pathToFileURL(path.join(root,'visual-guide-export.js')).href),files=[];
 for(const [key,guide] of Object.entries(context.guides))for(const lang of ['en','fr','it'])for(const format of ['png','pdf']){
  const blob=await renderer.createExport({key,lang,guide,copy:guide[lang],ui:context.ui[lang]},format),bytes=Buffer.from(await blob.arrayBuffer());
  const rel='assets/visual-guides/'+lang+'/'+key+'.'+format,target=path.join(root,rel);
  fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);
  files.push({path:rel,bytes:bytes.length,sha256:hash(bytes),guide:key,language:lang,format});
 }
 const manifest={schema:'voce.visual-guide-assets.v1',editorial_date:'2026-10-11',published_at:new Date().toISOString().slice(0,10),guide_source_sha256:hash(Buffer.from(source)),exporter_sha256:hash(fs.readFileSync(path.join(root,'visual-guide-export.js'))),files};
 fs.writeFileSync(path.join(root,'assets/visual-guides/manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 console.log(JSON.stringify({public_assets:files.length}));
})().catch(e=>{console.error(e);process.exitCode=1});

