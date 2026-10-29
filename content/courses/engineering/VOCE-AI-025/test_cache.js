// Synthetic ordered-event model; no Redis, database or parallel threads.
const test=require('node:test');
const assert=require('node:assert/strict');
const base={tenant:'Orbe',access:'reader-A',policy:1,doc:'wait',v:9,k:30,g:7};
const key=q=>JSON.stringify([1,q.tenant,q.access,q.policy,q.doc,q.v,q.k,q.g]);
function publish(s,expected,next){
 if(s.current!==expected||!next.ready||next.coverage<next.target)return false;
 s.current=next.g;return true;
}
function putCurrent(s,c,g,k,value){if(s.current!==g)return false;c.set(k,value);return true;}
function tracker(start){const seen=new Set();return {position:start,apply(n){if(n>this.position)seen.add(n);while(seen.has(this.position+1)){seen.delete(++this.position);}return this.position;}};}
test('naive purge permits late resurrection',()=>{const c=new Map();const old=10;c.delete('q');c.set('q',old);assert.equal(c.get('q'),10);assert.notEqual(c.get('q'),20);});
test('generation namespace isolates a late fill',()=>{const c=new Map();const oldKey=key(base);const next={...base,g:8};c.delete(key(next));c.set(oldKey,10);assert.equal(c.get(key(next)),undefined);c.set(key(next),20);assert.equal(c.get(key(next)),20);assert.equal(c.get(oldKey),10);});
test('fenced insertion rejects obsolete computation',()=>{const s={current:7},c=new Map();assert.ok(publish(s,7,{g:8,ready:true,coverage:43,target:43}));assert.equal(putCurrent(s,c,7,key(base),10),false);assert.equal(c.size,0);});
test('complete prepared generation publishes; partial does not',()=>{const s={current:7};assert.equal(publish(s,7,{g:8,ready:false,coverage:43,target:43}),false);assert.equal(publish(s,7,{g:8,ready:true,coverage:41,target:43}),false);assert.equal(s.current,7);assert.ok(publish(s,7,{g:8,ready:true,coverage:43,target:43}));assert.equal(s.current,8);});
test('competing publisher cannot overwrite changed pointer',()=>{const s={current:8};assert.equal(publish(s,7,{g:9,ready:true,coverage:43,target:43}),false);assert.equal(s.current,8);});
test('watermark follows contiguous applied prefix, not maximum',()=>{const t=tracker(40);assert.equal(t.apply(41),41);assert.equal(t.apply(43),41);assert.equal(t.apply(42),43);assert.equal(t.apply(41),43);});
test('each temporal and access dependency partitions keys',()=>{for(const [field,value] of Object.entries({tenant:'Other',access:'reader-B',policy:2,doc:'other',v:10,k:20,g:8})){assert.notEqual(key({...base,[field]:value}),key(base),field);}});
test('structured encoding avoids separator ambiguity',()=>{assert.notEqual(key({...base,tenant:'a|b',access:'c'}),key({...base,tenant:'a',access:'b|c'}));});
test('negative cached result does not mask new generation',()=>{const c=new Map([[key(base),{status:'absent'}]]);assert.equal(c.get(key({...base,g:8})),undefined);assert.equal(c.get(key(base)).status,'absent');});
test('TTL freshness does not imply document freshness',()=>{const created=100,expires=160,corrected=110,now=120;assert.ok(created<corrected&&corrected<=now);assert.ok(now<expires);assert.notEqual(key(base),key({...base,g:8}));});
test('post-filtered top-k can miss an admissible candidate',()=>{const ranked=[false,false,false,false,true];assert.equal(ranked.slice(0,3).filter(Boolean).length,0);assert.equal(ranked.filter(Boolean).slice(0,3).length,1);});
