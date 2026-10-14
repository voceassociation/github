// DOM verification, without launching a browser. Set LEGIS_JSDOM_MODULE to the
// absolute jsdom module path if it is installed outside this checkout.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import * as core from '../legis-core.js';
import {COPY} from '../legis-copy.js';
const require=createRequire(import.meta.url);
let JSDOM;try{({JSDOM}=require(process.env.LEGIS_JSDOM_MODULE || 'jsdom'));}catch{}
const catalog=JSON.parse(fs.readFileSync(new URL('../data/legis-sources.json',import.meta.url),'utf8'));
const script=fs.readFileSync(new URL('../legis-ui.js',import.meta.url),'utf8').replace(/^import[^\n]+\n/gm,'');
async function setup(lang,apiError){
  const file=lang==='en'?'../legis.html':'../'+lang+'/legis.html';
  const dom=new JSDOM(fs.readFileSync(new URL(file,import.meta.url),'utf8'),{url:'https://voce.life/'+(lang==='en'?'':lang+'/')+'legis',runScripts:'outside-only'});
  const w=dom.window,calls=[],exports=[],prints=[];
  w.__COPY=COPY;w.__core=core;w.matchMedia=()=>({matches:false});w.HTMLElement.prototype.scrollIntoView=()=>{};
  w.Blob=Blob;w.URL.createObjectURL=blob=>{exports.push(blob);return 'blob:qa';};w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=function(){};w.print=()=>prints.push(w.document.getElementById('legis-print-area').innerHTML);
  w.fetch=async(url,options)=>{calls.push({url,options});if(url==='/data/legis-sources.json')return Response.json(catalog);if(url==='/api/legis/status')return Response.json({status:'ready'});if(apiError)return Response.json({error:apiError},{status:429});return Response.json({status:'complete',generated_at:'2026-10-14T15:00:00Z',reads:[{model:core.MODEL_IDS.qwen,usage:{input_tokens:10,output_tokens:20},note:{summary:'<img src=x onerror="alert(1)">',issues:[{title:COPY[lang].observations,observation:COPY[lang].scopeText,source_ids:['gdpr-28']}],questions:[COPY[lang].question],limits:[COPY[lang].phase]}}]});};
  w.eval(`const COPY=window.__COPY; const {localChecklist,selectSources,sourcesAreFresh}=window.__core;\n${script}`);
  const tick=async()=>{for(let i=0;i<4;i++)await new Promise(r=>setImmediate(r));};await tick();
  return {dom,w,calls,exports,prints,tick,el:id=>w.document.getElementById('legis-'+id)};
}
for(const lang of ['fr','en','it'])test('local workshop, consent, export and escaped AI output in '+lang,{skip:!JSDOM},async()=>{
  const r=await setup(lang);try{
    assert.equal(r.calls.filter(c=>c.url==='/api/legis/analyse').length,0);assert.equal(r.el('consent').checked,false);assert.equal(r.el('prepare').disabled,false);
    r.w.document.querySelector('[data-legis-example]').click();assert.equal(r.el('question').value,COPY[lang].demoQuestion);assert.equal(r.calls.filter(c=>c.url==='/api/legis/analyse').length,0);
    r.el('form').dispatchEvent(new r.w.Event('submit',{bubbles:true,cancelable:true}));assert.equal(r.el('result').hidden,false);assert.equal(r.w.document.querySelectorAll('.legis-check').length,12);
    r.el('analyse').click();await r.tick();assert.equal(r.calls.filter(c=>c.url==='/api/legis/analyse').length,0);assert.equal(r.el('message').textContent,COPY[lang].needConsent);
    const progress=r.w.document.querySelector('[data-legis-progress]');progress.value='1';progress.dispatchEvent(new r.w.Event('change',{bubbles:true}));
    r.el('export').click();assert.match(await r.exports[0].text(),/VOCE · LEGIS/);assert.ok((await r.exports[0].text()).includes(COPY[lang].progress[1]));
    r.el('consent').checked=true;r.el('analyse').click();await r.tick();const call=r.calls.find(c=>c.url==='/api/legis/analyse');assert.ok(call);const body=JSON.parse(call.options.body);assert.equal(body.consent,true);assert.equal(body.question,COPY[lang].demoQuestion);assert.equal(body.lang,lang);
    assert.equal(r.el('readings').querySelectorAll('img').length,0);assert.ok(r.el('readings').textContent.includes('<img'));assert.equal(r.el('consent').checked,false);
    r.el('print').click();assert.equal(r.prints.length,1);assert.equal(r.el('print-area').querySelectorAll('img').length,0);
    r.el('question').value+=' changed';r.el('question').dispatchEvent(new r.w.Event('input',{bubbles:true}));assert.equal(r.el('result').hidden,true);assert.equal(r.el('analyse').disabled,true);assert.equal(r.el('consent').checked,false);
    r.el('clear').click();assert.equal(r.el('question').value,'');assert.equal(r.el('clause').value,'');
  }finally{r.dom.window.close();}
});
test('quota failure leaves the local checklist exportable',{skip:!JSDOM},async()=>{
  const r=await setup('fr','quota_reached');try{r.w.document.querySelector('[data-legis-example]').click();r.el('form').dispatchEvent(new r.w.Event('submit',{cancelable:true}));r.el('consent').checked=true;r.el('analyse').click();await r.tick();assert.equal(r.el('message').textContent,COPY.fr.errors.quota_reached);assert.equal(r.el('result').hidden,false);r.el('export').click();assert.equal(r.exports.length,1);}finally{r.dom.window.close();}
});
