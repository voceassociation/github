import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import worker from '../worker.js';
import {serveCachedPublicPage} from '../public-page-cache.js';
import {renderAtlasRelationContext,ATLAS_EDITORIAL_COPY} from '../atlas-editorial.js';

test('static requests never read the corpus or route dataset',async()=>{
  for (const path of ['/styles.css','/data/atlas.json','/sitemap.xml','/favicon.svg','/missing-page']) {
    const seen=[];
    const response=await worker.fetch(new Request('https://voce.life'+path),{ASSETS:{fetch:async request=>{
      seen.push(new URL(request.url).pathname);
      assert.equal(new URL(request.url).pathname,path);
      return new Response('asset',{status:path==='/missing-page'?404:200,headers:{'content-type':'application/octet-stream'}});
    }}},{});
    assert.deepEqual(seen,[path]);assert.equal(await response.text(),'asset');
  }
});

function cacheFixture(){
  const saved=new Map(),pending=[];
  const cache={match:async key=>saved.get(key.url)?.clone(),put:async(key,response)=>saved.set(key.url,response)};
  return {cache,ctx:{waitUntil:p=>pending.push(p)},flush:async()=>Promise.all(pending),saved};
}
test('public render cache reuses a page but cannot reuse an earlier deployment',async()=>{
  const f=cacheFixture();let renders=0;
  const render=async()=>new Response('render '+(++renders),{headers:{'content-type':'text/html','cache-control':'public, max-age=300'}});
  const request=new Request('https://voce.life/fr/atlas/relations/mcp--saas');
  const first=await serveCachedPublicPage(request,{CF_VERSION_METADATA:{id:'v1'}},f.ctx,render,f.cache);
  assert.equal(first.headers.get('x-voce-render-cache'),'MISS');assert.equal(await first.text(),'render 1');await f.flush();
  const hit=await serveCachedPublicPage(request,{CF_VERSION_METADATA:{id:'v1'}},f.ctx,render,f.cache);
  assert.equal(hit.headers.get('x-voce-render-cache'),'HIT');assert.equal(await hit.text(),'render 1');assert.equal(renders,1);
  const updated=await serveCachedPublicPage(request,{CF_VERSION_METADATA:{id:'v2'}},f.ctx,render,f.cache);
  assert.equal(await updated.text(),'render 2');await f.flush();assert.equal(f.saved.size,2);
});
test('cases, API calls, authenticated requests, queries and private responses never enter the render cache',async()=>{
  for (const [path,options] of [
    ['/api/legis/analyse',{method:'POST',body:'private case'}],['/fr/legis/aide',{}],['/art/vault',{}],
    ['/fr/atlas/mcp?context=private',{}],['/fr/atlas/mcp',{headers:{cookie:'private=1'}}],
    ['/fr/atlas/mcp',{headers:{authorization:'Bearer private'}}],['/fr/atlas/mcp',{method:'HEAD'}]
  ]) {
    const f=cacheFixture();
    await serveCachedPublicPage(new Request('https://voce.life'+path,options),{CF_VERSION_METADATA:{id:'v1'}},f.ctx,async()=>new Response('private'),f.cache);
    await f.flush();assert.equal(f.saved.size,0);
  }
  for(const headers of [{'cache-control':'private, no-store'},{'cache-control':'public, max-age=300','set-cookie':'case=private'},{'cache-control':'public, max-age=300',vary:'*'}]){
    const f=cacheFixture();
    await serveCachedPublicPage(new Request('https://voce.life/fr/atlas/mcp'),{CF_VERSION_METADATA:{id:'v1'}},f.ctx,async()=>new Response('private',{headers:{'content-type':'text/html',...headers}}),f.cache);
    await f.flush();assert.equal(f.saved.size,0);
  }
});
test('cache errors do not prevent serving the public record',async()=>{
  const f=cacheFixture(),cache={match:async()=>{throw Error('unavailable')},put:async()=>{throw Error('unavailable')}};
  const response=await serveCachedPublicPage(new Request('https://voce.life/atlas/mcp'),{CF_VERSION_METADATA:{id:'v1'}},f.ctx,async()=>new Response('public',{headers:{'content-type':'text/html','cache-control':'public, max-age=300'}}),cache);
  assert.equal(await response.text(),'public');await f.flush();
});
test('all relation contexts have real definitions, canonical neighbours and a class-specific review question in three languages',()=>{
  const atlas=JSON.parse(fs.readFileSync(new URL('../data/atlas.json',import.meta.url)));
  const ids=new Set(atlas.edges.map(edge=>edge.id));
  for(const lang of ['fr','en','it'])for(const edge of atlas.edges){
    const html=renderAtlasRelationContext(atlas,edge,lang);
    assert.ok(html.includes(ATLAS_EDITORIAL_COPY[lang].questions[edge.semantic_type]));
    for(const id of [edge.source,edge.target]){
      const node=atlas.nodes.find(n=>n.id===id);
      assert.ok(html.includes((node.i18n?.[lang]?.summary||node.summary).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')));
    }
    for(const match of html.matchAll(/href="[^"?]*\/relations\/([^"/]+)"/g))assert.ok(ids.has(match[1]),match[1]);
    assert.ok(html.includes(atlas.generated_at));assert.ok(!html.includes('undefined'));
  }
  const hostile=structuredClone(atlas);hostile.nodes[0].summary='<img src=x onerror=alert(1)>';
  assert.ok(!renderAtlasRelationContext(hostile,hostile.edges[0]).includes('<img'));
});
