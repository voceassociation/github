const assert=require('node:assert/strict'),test=require('node:test');
const inf=Infinity;
const rows=[{id:'A',value:10,v:[0,inf],k:[0,15]},{id:'B',value:10,v:[0,10],k:[15,25]},{id:'C',value:20,v:[10,inf],k:[15,25]},{id:'D',value:10,v:[0,8],k:[25,inf]},{id:'E',value:20,v:[8,inf],k:[25,inf]}];
const contains=(r,t)=>r[0]<=t&&t<r[1];
const overlap=(a,b)=>a[0]<b[1]&&b[0]<a[1];
function select(rs,v,k){if(!Number.isFinite(v)||!Number.isFinite(k))throw Error('finite query required');const a=rs.filter(r=>contains(r.v,v)&&contains(r.k,k));return a.length===1?{status:'found',id:a[0].id,value:a[0].value}:{status:a.length?'ambiguous':'absent'};}
function valid(rs){for(const r of rs)for(const x of [r.v,r.k])if(!Number.isFinite(x[0])||!(Number.isFinite(x[1])||x[1]===Infinity)||x[0]>=x[1])throw Error('invalid interval');for(let i=0;i<rs.length;i++)for(let j=i+1;j<rs.length;j++)if(overlap(rs[i].v,rs[j].v)&&overlap(rs[i].k,rs[j].k))throw Error('rectangle overlap');}
test('half-open boundary',()=>{assert.equal(contains([0,10],10),false);assert.equal(contains([10,20],10),true);});
test('adjacent periods do not overlap',()=>assert.equal(overlap([0,10],[10,20]),false));
test('historical knowledge before import',()=>assert.deepEqual(select(rows,12,12),{status:'found',id:'A',value:10}));
test('later knowledge revises same event',()=>assert.deepEqual(select(rows,12,20),{status:'found',id:'C',value:20}));
test('earlier event remains old rule',()=>assert.equal(select(rows,5,20).id,'B'));
test('retroactive correction changes event 9',()=>{assert.equal(select(rows,9,20).value,10);assert.equal(select(rows,9,30).value,20);});
test('exact knowledge boundary uses new state',()=>{assert.equal(select(rows,9,25).id,'E');assert.equal(select(rows,12,15).id,'C');});
test('complete history has no conflicting rectangles',()=>valid(rows));
test('unclosed correction rejected and query ambiguous',()=>{const bad=rows.map(r=>r.id==='C'?{...r,k:[15,inf]}:r);assert.throws(()=>valid(bad));assert.equal(select(bad,12,30).status,'ambiguous');});
test('missing and nonfinite query',()=>{assert.equal(select(rows,-1,30).status,'absent');assert.throws(()=>select(rows,NaN,30));});
test('empty or reversed interval rejected',()=>{for(const v of [[10,10],[10,9]])assert.throws(()=>valid([{v,k:[0,10]}]));});
