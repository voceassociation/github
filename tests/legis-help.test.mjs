import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import worker from '../worker.js';
import {makePlan,normalizeCase,resourcesNeedReview,makeDraft,documentText} from '../legis-help-core.js';
import {HELP_COPY,HELP_ROUTES,CATEGORIES,RESOURCES,FLAGS} from '../legis-help-content.js';

test('every France topic has a real first contact and complete translated preparation',()=>{
  for(const lang of ['fr','en','it'])for(const category of CATEGORIES){
    const p=makePlan({lang,jurisdiction:'fr',category},new Date('2026-10-15'));
    assert.ok(p.inFrance);assert.ok(!p.needsReview);assert.ok(p.resources.length>=3);assert.ok(p.resources.every(s=>s.url.startsWith('https://')));assert.ok(p.documents.length>=4);assert.ok(p.questions.length>=4);
    for(const resource of p.resources)assert.ok(resource.name[lang]&&resource.text[lang]&&resource.action[lang]);
    const text=documentText(p,new Set([0]),makeDraft(p));assert.ok(text.includes('[x] '+p.documents[0]));assert.ok(text.includes(HELP_COPY[lang].deadlineNote));assert.ok(text.includes(p.resources[0].url));assert.ok(text.includes(HELP_COPY[lang].scope));
  }
  assert.equal(makePlan({jurisdiction:'fr',category:'housing'}).resources[0].id,'adil');
  assert.equal(makePlan({jurisdiction:'fr',category:'administration'}).resources[0].id,'france');
});
test('safety, housing and essential needs are independently routed; a date is never calculated',()=>{
  for(const lang of ['fr','en','it']){
    const p=makePlan({lang,jurisdiction:'fr',category:'consumer',flags:FLAGS,date:'2026-10-20'});
    assert.equal(p.resources[0].id,'victims');assert.ok(p.resources.some(s=>s.id==='adil'));assert.ok(p.resources.some(s=>s.id==='social'));assert.equal(new Set(p.resources.map(s=>s.id)).size,p.resources.length);assert.equal(p.priorities.length,4);
    const txt=documentText(p);assert.ok(txt.includes('2026-10-20'));assert.ok(txt.includes(HELP_COPY[lang].dateRecorded));assert.ok(!txt.includes('2026-10-21'));
  }
});
test('a non-France case receives no French legal route or France-only emergency number',()=>{
  for(const lang of ['fr','en','it']){
    const p=makePlan({lang,jurisdiction:'other',category:'housing',flags:FLAGS,date:'2026-10-20'});
    assert.deepEqual(p.resources.map(s=>s.id),['europe']);assert.equal(p.inFrance,false);assert.ok(!p.priorities.join(' ').includes('116 006'));assert.deepEqual(p.documents.slice(3),HELP_COPY[lang].specificDocs.other);assert.ok(documentText(p).includes(HELP_COPY[lang].outsideText));
  }
});
test('bounded normalisation and dated resources do not claim continuing verification',()=>{
  const c=normalizeCase({jurisdiction:'unrecognised',category:'bad',flags:['deadline','deadline','bad'],date:'2026-02-31',facts:'x'.repeat(3000),goal:42});
  assert.equal(c.jurisdiction,'other');assert.equal(c.category,'other');assert.deepEqual(c.flags,['deadline']);assert.equal(c.date,'');assert.equal(c.facts.length,1600);assert.equal(c.goal,'');
  assert.equal(resourcesNeedReview('2026-11-16'),true);assert.equal(resourcesNeedReview('invalid'),true);assert.equal(resourcesNeedReview('2026-10-20'),false);
  assert.ok(makePlan({jurisdiction:'fr',category:'debt'},'2026-11-16').needsReview);
});
test('public pages preserve privacy headers, static imports and metadata without shared injections',async()=>{
  for(const [lang,path] of Object.entries(HELP_ROUTES)){
    const file=new URL('..'+path+'.html',import.meta.url),html=fs.readFileSync(file,'utf8');
    assert.ok(html.includes('lang="'+lang+'"'));assert.ok(html.includes('https://voce.life'+path));assert.ok(html.includes('property="og:title"'));assert.ok(!html.includes('voce-analytics'));assert.ok(!html.includes('localStorage'));
    const seen=[];const response=await worker.fetch(new Request('https://voce.life'+path),{ASSETS:{fetch:async req=>{seen.push(req.url);return new Response(html,{headers:{'content-type':'text/html'}});}}},{});
    assert.equal(response.status,200);assert.deepEqual(seen,['https://voce.life'+path]);assert.equal(response.headers.get('referrer-policy'),'no-referrer');assert.match(response.headers.get('content-security-policy'),/connect-src 'none'/);assert.match(response.headers.get('content-security-policy'),/form-action 'none'/);assert.ok(!(await response.text()).includes('voce-analytics'));
  }
  const redirect=await worker.fetch(new Request('https://voce.life/en/legis/help'),{},{});assert.equal(redirect.status,308);assert.equal(redirect.headers.get('location'),'https://voce.life/legis/help');
  const ui=fs.readFileSync(new URL('../legis-help-ui.js',import.meta.url),'utf8');assert.ok(!/\b(fetch|sendBeacon|XMLHttpRequest|WebSocket|localStorage|sessionStorage)\s*[.(]/.test(ui));
});
