import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import * as core from '../legis-help-core.js';
import {HELP_COPY,CHECKED_AT,HELP_ROUTES} from '../legis-help-content.js';
const require=createRequire(import.meta.url);
let JSDOM;try{({JSDOM}=require(process.env.LEGIS_JSDOM_MODULE||'jsdom'));}catch{}
const script=fs.readFileSync(new URL('../legis-help-ui.js',import.meta.url),'utf8').replace(/^import[^\n]+\n/gm,'');
function setup(lang){
  const dom=new JSDOM(fs.readFileSync(new URL('..'+HELP_ROUTES[lang]+'.html',import.meta.url),'utf8'),{url:'https://voce.life'+HELP_ROUTES[lang],runScripts:'outside-only'}),w=dom.window,exports=[],prints=[];
  const el=id=>w.document.getElementById('help-'+id);
  w.__core=core;w.__copy=HELP_COPY;w.__date=CHECKED_AT;w.matchMedia=()=>({matches:true});w.HTMLElement.prototype.scrollIntoView=()=>{};w.URL.createObjectURL=blob=>{exports.push(blob);return 'blob:qa';};w.URL.revokeObjectURL=()=>{};w.Blob=Blob;w.HTMLAnchorElement.prototype.click=function(){};w.print=()=>prints.push(el('print-area').innerHTML);
  w.fetch=()=>{throw new Error('A case must not be transmitted');};
  w.eval(`const HELP_COPY=window.__copy,CHECKED_AT=window.__date; const {makePlan,makeDraft,documentSections,documentText}=window.__core;\n${script}`);
  const input=(id,value)=>{el(id).value=value;el(id).dispatchEvent(new w.Event('input',{bubbles:true}));};
  const submit=()=>el('form').dispatchEvent(new w.Event('submit',{cancelable:true,bubbles:true}));
  return {dom,w,el,exports,prints,input,submit,topic:value=>w.document.querySelector('input[name="topic"][value="'+value+'"]').click(),flag:value=>w.document.querySelector('input[name="priority"][value="'+value+'"]').click()};
}
for(const lang of ['fr','en','it'])test('local case, priorities, editable export, safe print and invalidation in '+lang,{skip:!JSDOM},async()=>{
  const r=setup(lang);try{
    assert.equal(r.el('prepare').disabled,false);r.submit();assert.equal(r.el('result').hidden,true);assert.equal(r.el('message').textContent,HELP_COPY[lang].needCategory);
    r.topic('housing');r.flag('deadline');assert.equal(r.el('date-row').hidden,false);r.input('date','2026-10-20');
    const hostile='<img src=x onerror="alert(1)">';r.input('facts',hostile);r.input('timeline','2026-10-15: letter received');r.submit();assert.equal(r.el('result').hidden,false);assert.equal(r.el('summary').querySelectorAll('img').length,0);assert.ok(r.el('summary').textContent.includes(hostile));assert.ok(r.el('contacts').querySelector('a').href.startsWith('https://www.anil.org/'));assert.ok(r.el('priorities').textContent.includes(HELP_COPY[lang].priorityDeadline));
    r.w.document.querySelector('[data-help-document="0"]').click();r.el('draft').value+='\nCUSTOM NOTE';r.el('download').click();assert.equal(r.exports.length,1);const txt=await r.exports[0].text();assert.ok(txt.includes(hostile));assert.ok(txt.includes('CUSTOM NOTE'));assert.ok(txt.includes('[x] '));assert.ok(txt.includes('2026-10-20'));
    r.el('print').click();assert.equal(r.prints.length,1);assert.equal(r.el('print-area').querySelectorAll('img').length,0);assert.ok(r.el('print-area').textContent.includes('CUSTOM NOTE'));
    r.input('facts','changed');assert.equal(r.el('result').hidden,true);assert.equal(r.el('draft').value,'');assert.equal(r.el('print-area').textContent,'');assert.equal(r.el('contacts').textContent,'');r.el('download').click();assert.equal(r.exports.length,1);
    r.flag('deadline');assert.equal(r.el('date-row').hidden,true);assert.equal(r.el('date').value,'');r.el('reset').click();assert.equal(r.el('facts').value,'');assert.equal(r.w.document.querySelector('input[name="topic"]:checked'),null);assert.equal(r.el('message').textContent,HELP_COPY[lang].cleared);
  }finally{r.dom.window.close();}
});
test('foreign jurisdiction hides France emergency advice and generates an external-country sheet',{skip:!JSDOM},()=>{
  const r=setup('fr');try{
    r.topic('discrimination');r.flag('violence');assert.equal(r.el('safety').hidden,false);r.input('country','other');assert.equal(r.el('safety').hidden,true);assert.equal(r.el('outside-hint').hidden,false);r.submit();assert.equal(r.el('outside').hidden,false);assert.equal(r.el('contacts').querySelectorAll('.help-contact').length,1);assert.equal(r.el('contacts').querySelector('a').href,'https://e-justice.europa.eu/');assert.ok(!r.el('priorities').textContent.includes('116 006'));
  }finally{r.dom.window.close();}
});
