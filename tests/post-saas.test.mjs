import test from 'node:test';import assert from 'node:assert/strict';import {calculate,defaults,csv}from '../assets/post-saas/calculator.mjs';
const zero=Object.fromEntries(Object.keys(defaults).map(k=>[k,0]));
test('zero baseline never divides by zero',()=>{const r=calculate(zero);assert.equal(r.percent,null);assert.equal(r.savings,0);});
test('constant costs and investment',()=>{const r=calculate({...zero,fixed:100,hosting:50,implementation:600});assert.equal(r.current,3600);assert.equal(r.alternative,2400);assert.equal(r.first,12);assert.equal(r.savings,1200);});
test('unfavourable alternative',()=>{assert.equal(calculate({...zero,fixed:100,hosting:200}).savings,-3600);});
test('inflation starts at months 13 and 25',()=>{const r=calculate({...zero,fixed:100,saasGrowth:10});assert.equal(r.rows[11].baseline,100);assert.equal(r.rows[12].baseline,110.00000000000001);assert.ok(Math.abs(r.current-3972)<1e-8);});
test('coexistence includes legacy administration exactly once',()=>{const r=calculate({...zero,fixed:100,admin:20,legacyAdmin:20,hosting:10,coexist:36});assert.equal(r.current,4320);assert.equal(r.alternative,4680);assert.equal(r.savings,-360);assert.equal(calculate({...zero,fixed:100,legacyAdmin:20,hosting:10,coexist:0}).alternative,360);});
test('investment included in year one and reconciles',()=>{const r=calculate(defaults);assert.ok(Math.abs(r.annual.reduce((a,b)=>a+b.alternative,0)-r.alternative)<1e-7);assert.equal(r.rows[0].investment,55000);assert.equal(r.rows[1].investment,0);});
test('invalid input rejected, including blank and fractional duration',()=>{for(const patch of [{users:''},{seat:NaN},{coexist:37},{coexist:1.5},{hosting:-1},{opsGrowth:101}])assert.throws(()=>calculate({...defaults,...patch}));});
test('CSV has 36 numeric rows with investment disclosed',()=>{const lines=csv(calculate(defaults)).split('\r\n');assert.equal(lines.length,37);assert.equal(lines[1].split(',')[4],'55000.00');});
test('first crossover is not necessarily sustained payback',()=>{const r=calculate({...zero,fixed:100,hosting:60,opsGrowth:100});assert.equal(r.first,1);assert.equal(r.durable,null);assert.ok(r.savings<0);});

test('financial pages bypass shared injections and reject submissions',async()=>{
 const {default:worker}=await import('../worker.js');
 for(const path of ['/applied/post-saas','/fr/applied/post-saas','/it/applied/post-saas.html']){
  const env={ASSETS:{fetch:async()=>new Response('<html>local calculator</html>',{headers:{'content-type':'text/html'}})}};
  const r=await worker.fetch(new Request('https://voce.life'+path),env,{});
  assert.equal(await r.text(),'<html>local calculator</html>');assert.ok(r.headers.get('content-security-policy').includes("form-action 'none'"));
  assert.equal((await worker.fetch(new Request('https://voce.life'+path,{method:'POST',body:'private'}),env,{})).status,405);
 }
});
