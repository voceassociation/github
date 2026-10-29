const assert=require('node:assert/strict'),test=require('node:test');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-12);
function scale(c){if(!c.length||!c.every(Number.isFinite))throw Error('invalid calibration');const m=Math.max(...c.map(Math.abs));if(!m)throw Error('zero range');return m/7;}
function argmax(a){if(!a.length||!a.every(Number.isFinite))throw Error('invalid scores');return a.reduce((best,x,i)=>x>a[best]?i:best,0);}
function margin(a){const k=argmax(a);if(a.length<2)throw Error('two classes required');return a[k]-Math.max(...a.filter((_,i)=>i!==k));}
function disjoint(...sets){const seen=new Set();for(const s of sets)for(const id of s){if(seen.has(id))throw Error('overlap or duplicate');seen.add(id);}}
function paired(a,b){const map=new Map();for(const x of b){if(map.has(x.id))throw Error('duplicate');map.set(x.id,x);}const seen=new Set(),n={n11:0,n10:0,n01:0,n00:0,disagree:0};for(const x of a){if(seen.has(x.id))throw Error('duplicate');seen.add(x.id);const y=map.get(x.id);if(!y||y.label!==x.label)throw Error('unmatched');n['n'+Number(x.pred===x.label)+Number(y.pred===y.label)]++;n.disagree+=Number(x.pred!==y.pred);}if(seen.size!==map.size)throw Error('extra');return n;}
test('calibration range sensitive to outlier',()=>{close(scale([-1,-.5,0,.5,1]),1/7);close(scale([-1,0,1,10]),10/7);});
test('calibration rejects empty nonfinite zero range',()=>{for(const c of [[],[NaN],[Infinity],[0,0]])assert.throws(()=>scale(c));});
test('disjoint data roles',()=>{disjoint(['c1'],['v1'],['t1']);assert.throws(()=>disjoint(['c1'],['c1']));});
test('argmax stable under bounded perturbations',()=>{const a=[1.2,1,-.4];assert.ok(margin(a)>2*.05);for(const e0 of [-.05,.05])for(const e1 of [-.05,.05])for(const e2 of [-.05,.05])assert.equal(argmax(a.map((x,i)=>x+[e0,e1,e2][i])),0);});
test('small margin permits flip',()=>{assert.equal(argmax([1.02,1,-.4]),0);assert.equal(argmax([1,1.02,-.4]),1);});
test('boundary tie changes winner with exact binary values',()=>{assert.equal(argmax([.75,1]),1);assert.equal(argmax([.875,.875]),0);close(margin([.75,1]),2*.125);});
test('nonfinite scores rejected',()=>{for(const a of [[],[NaN,1],[1,Infinity]])assert.throws(()=>argmax(a));});
test('unchanged accuracy can hide losses and gains',()=>{const a=Array.from({length:10},(_,i)=>({id:i,label:1,pred:i===9?0:1}));const b=a.map((x,i)=>({...x,pred:i===8?0:1})).reverse();assert.deepEqual(paired(a,b),{n11:8,n10:1,n01:1,n00:0,disagree:2});});
test('both wrong can still disagree',()=>assert.deepEqual(paired([{id:0,label:2,pred:0}],[{id:0,label:2,pred:1}]),{n11:0,n10:0,n01:0,n00:1,disagree:1}));
test('bad joins rejected',()=>{const x={id:1,label:0,pred:0};for(const b of [[],[x,x],[{...x,label:1}],[x,{...x,id:2}]])assert.throws(()=>paired([x],b));assert.throws(()=>paired([x,x],[x]));});
test('common translation preserves winner',()=>assert.equal(argmax([2,1,0]),argmax([102,101,100])));
