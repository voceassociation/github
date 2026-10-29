const assert=require('node:assert/strict'),test=require('node:test');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-12);
function metrics(g,r){if(new Set(g).size!==g.length||new Set(r).size!==r.length)throw Error('duplicate');const gold=new Set(g),hits=r.filter(x=>gold.has(x)).length,first=r.findIndex(x=>gold.has(x));return {recall:g.length?hits/g.length:null,precision:r.length?hits/r.length:null,complete:g.length?hits===g.length:null,rr:g.length?(first<0?0:1/(first+1)):null};}
function eligible(d,allowed,indexed){return d.filter(x=>allowed.includes(x)&&indexed.includes(x));}
test('partial evidence',()=>assert.deepEqual(metrics(['P1','P2'],['P3','P1','P5']),{recall:.5,precision:1/3,complete:false,rr:.5}));
test('complete evidence with distractor',()=>assert.deepEqual(metrics(['P1','P2'],['P1','P2','P5']),{recall:1,precision:2/3,complete:true,rr:1}));
test('perfect minimal set',()=>assert.deepEqual(metrics(['P1','P2'],['P1','P2']),{recall:1,precision:1,complete:true,rr:1}));
test('empty result is recall zero with precision undefined',()=>assert.deepEqual(metrics(['P1'],[]),{recall:0,precision:null,complete:false,rr:0}));
test('unanswerable not assigned perfect recall',()=>assert.deepEqual(metrics([],['P5']),{recall:null,precision:0,complete:null,rr:null}));
test('duplicates rejected',()=>{assert.throws(()=>metrics(['P1'],['P1','P1']));assert.throws(()=>metrics(['P1','P1'],[]));});
test('first hit cannot certify full coverage',()=>{const a=metrics(['P1','P2'],['P1','P3']),b=metrics(['P1','P2'],['P1','P2']);assert.equal(a.rr,b.rr);assert.notEqual(a.complete,b.complete);});
test('mean reciprocal rank differs from reciprocal mean rank',()=>{close((1+1/3)/2,2/3);assert.notEqual((1+1/3)/2,1/2);});
test('macro and micro recall differ',()=>{close((1+1/9)/2,5/9);close((1+1)/(1+9),.2);});
test('access and index both constrain results',()=>assert.deepEqual(eligible(['P1','P2','P3'],['P1','P3'],['P1','P2']),['P1']));
test('success decomposition includes incomplete contexts',()=>{close(.6*.8+.4*.2,.56);assert.notEqual(.6*.8,.56);});
