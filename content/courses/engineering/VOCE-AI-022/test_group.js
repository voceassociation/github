// Scalar teaching examples only; no model, optimizer or RL training.
const assert=require('node:assert/strict');
const test=require('node:test');
function advantages(r){
 if(r.length<2||!r.every(Number.isFinite))throw Error('finite group of size >=2 required');
 const mean=r.reduce((a,b)=>a+b,0)/r.length;
 const variance=r.reduce((a,b)=>a+(b-mean)**2,0)/r.length;
 if(!Number.isFinite(variance))throw Error('nonfinite variance');
 return {mean,variance,constant:variance===0,a:r.map(x=>variance===0?0:(x-mean)/Math.sqrt(variance))};
}
function contribution(rho,a,e=.2){return Math.min(rho*a,Math.max(1-e,Math.min(1+e,rho))*a);}
function contrast(p,g){return 1-p**g-(1-p)**g;}
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-12,`${a} != ${b}`);
test('balanced group and population variance',()=>{const x=advantages([0,0,1,1]);assert.deepEqual(x.a,[-1,-1,1,1]);close(x.variance,.25);});
test('one success group',()=>{const x=advantages([0,0,0,1]);x.a.slice(0,3).forEach(a=>close(a,-1/Math.sqrt(3)));close(x.a[3],Math.sqrt(3));});
test('mean zero and mean square one',()=>{const a=advantages([.2,.4,.7,1]).a;close(a.reduce((s,x)=>s+x,0),0);close(a.reduce((s,x)=>s+x*x,0)/4,1);});
test('positive affine invariance',()=>assert.deepEqual(advantages([5,5,7,7]).a,advantages([0,0,1,1]).a));
test('constant success and failure distinguished by mean',()=>{for(const k of [0,1]){const x=advantages([k,k,k,k]);assert.ok(x.constant);assert.deepEqual(x.a,[0,0,0,0]);assert.equal(x.mean,k);}});
test('invalid scores rejected',()=>{for(const r of [[],[1],[NaN,1],[Infinity,1],[1e308,-1e308]])assert.throws(()=>advantages(r));});
test('additive stabilizer changes scale',()=>{const r=[0,0,.001,.001],x=advantages(r);close((r[2]-x.mean)/(Math.sqrt(x.variance)+.001),1/3);});
test('four clipping quadrants',()=>{close(contribution(1.5,1),1.2);close(contribution(.5,1),.5);close(contribution(1.5,-1),-1.5);close(contribution(.5,-1),-.8);});
test('zero mean advantages need not mean zero gradient',()=>{for(const p of [.1,.5,.9])close(((1-p)+p)/2,.5);});
test('informative binary group probability',()=>{close(contrast(.1,4),.3438);close(contrast(.1,8),.56953278);close(contrast(0,4),0);close(contrast(1,4),0);});
