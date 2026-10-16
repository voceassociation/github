import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let JSDOM;try{({JSDOM}=require(process.env.LEGIS_JSDOM_MODULE||'jsdom'));}catch{}
const atlas=JSON.parse(fs.readFileSync(new URL('../data/atlas.json',import.meta.url)));
const script=fs.readFileSync(new URL('../atlas.js',import.meta.url),'utf8');
for(const lang of ['en','fr','it'])test('all editorial paths open documented routes, with storage unavailable, in '+lang,{skip:!JSDOM},async()=>{
  const file=new URL(`../${lang==='en'?'':lang+'/'}atlas.html`,import.meta.url);
  const html=fs.readFileSync(file,'utf8');
  const initial=new JSDOM(html,{url:'https://voce.life/'+(lang==='en'?'':lang+'/')+'atlas'});
  const paths=[...initial.window.document.querySelectorAll('.atlas-dossier a')].map(a=>a.href);initial.window.close();
  assert.equal(paths.length,4);
  for(const path of paths){
    const dom=new JSDOM(html,{url:path,runScripts:'outside-only'}),w=dom.window;
    try{
      Object.defineProperty(w,'localStorage',{get(){throw new w.DOMException('Storage disabled','SecurityError')}});
      w.matchMedia=()=>({matches:false,addEventListener(){}});
      w.fetch=async()=>({ok:true,json:async()=>structuredClone(atlas)});
      w.eval(script);
      for(let i=0;i<4;i++)await new Promise(resolve=>setImmediate(resolve));
      const result=w.document.getElementById('atlas-path-result');
      assert.equal(result.hidden,false,path);assert.ok(result.querySelectorAll('.atlas-path-step').length>0,path);
      assert.ok(!result.textContent.includes('undefined'));
      const params=new URL(path).searchParams;
      assert.equal(w.document.getElementById('atlas-path-from').value,params.get('from'));
      assert.equal(w.document.getElementById('atlas-path-to').value,params.get('to'));
      assert.ok(w.document.getElementById('atlas-pathfinder'));
      const semantic=w.document.querySelector('[data-atlas-semantic="correlation"]');
      if(semantic){semantic.click();assert.ok(w.location.search.includes('semantic=correlation'));}
    }finally{w.close();}
  }
});
