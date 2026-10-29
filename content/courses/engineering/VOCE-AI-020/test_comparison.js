const test=require('node:test'),assert=require('node:assert/strict');
function budget(modules){assert.ok(modules.length);const seen=new Set();return modules.reduce((s,m)=>{assert.ok(!seen.has(m.name));seen.add(m.name);assert.ok([m.d,m.k,m.r].every(v=>Number.isInteger(v)&&v>0));return s+m.r*(m.d+m.k)},0)}
const modules=(n,r)=>Array.from({length:n},(_,i)=>({name:'matrix'+i,d:4096,k:4096,r}));
function disjoint(parts){const seen=new Set();for(const groups of parts)for(const g of groups){assert.ok(!seen.has(g),'family collision');seen.add(g)}}
function transitions(rows){const seen=new Set();let both=0,gain=0,loss=0,neither=0;for(const r of rows){assert.ok(!seen.has(r.id));seen.add(r.id);assert.equal(typeof r.base,'boolean');assert.equal(typeof r.adapted,'boolean');if(r.base&&r.adapted)both++;else if(r.adapted)gain++;else if(r.base)loss++;else neither++;}return{both,gain,loss,neither}}
const rows=(n,b,a,offset)=>Array.from({length:n},(_,i)=>({id:offset+i,base:b,adapted:a}));
const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
const accept=(critical,memory)=>critical>=.85&&memory<=64;
test('equal budgets different coverage',()=>{assert.equal(budget(modules(64,8)),4194304);assert.equal(budget(modules(128,4)),4194304);assert.equal(budget(modules(64,16)),8388608)});
test('manifest refuses duplicates and missing targets',()=>{assert.throws(()=>budget([]));assert.throws(()=>budget([...modules(1,8),...modules(1,8)]));});
test('family isolation',()=>{disjoint([['a','b'],['c'],['d']]);assert.throws(()=>disjoint([['a'],['b'],['a']]))});
test('throughput and relative changes',()=>{assert.equal(1200000/600,2000);assert.equal(1200000/750,1600);assert.equal((750-600)/600,.25);assert.equal((2000-1600)/2000,.2)});
test('replicate mean is not chosen maximum',()=>{assert.equal(mean([82,83,84]),83);assert.equal(mean([80,84,85]),83);assert.ok(Math.max(80,84,85)>Math.max(82,83,84))});
test('paired transition oracle',()=>{const r=transitions([...rows(130,true,true,0),...rows(20,false,true,130),...rows(10,true,false,150),...rows(40,false,false,160)]);assert.deepEqual(r,{both:130,gain:20,loss:10,neither:40});assert.equal((r.both+r.loss)/200,.7);assert.equal((r.both+r.gain)/200,.75)});
test('paired input rejects duplicate or missing verdict',()=>{assert.throws(()=>transitions([{id:1,base:true,adapted:true},{id:1,base:false,adapted:true}]));assert.throws(()=>transitions([{id:1,base:true}]))});
test('stratified reversal',()=>{assert.equal((144+18)/200,.81);assert.equal((162+12)/200,.87);assert.ok(Math.abs(mean([144/180,18/20])-.85)<1e-12);assert.equal(mean([162/180,12/20]),.75);assert.equal(accept(.6,64),false)});
test('inclusive acceptance boundaries',()=>{assert.equal(accept(.85,64),true);assert.equal(accept(.849,64),false);assert.equal(accept(.85,64.01),false)});
