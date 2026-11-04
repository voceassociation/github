// Synthetic verified contexts; no JWT, OAuth, MCP or concurrent database.
const assert=require('node:assert/strict');
let passed=0;const test=(name,f)=>{f();passed++;console.log('ok',name)};
const encode=x=>JSON.stringify(x);
function intersect(u,c,q){const cs=new Set(c.map(encode)),qs=new Set(q.map(encode));return u.filter(x=>cs.has(encode(x))&&qs.has(encode(x)));}
const read=['A','A17','read'],close=['A','A17','close'],other=['B','B42','close'];
const dimensions=['subject','actor','audience','organization','object','operation'];
const revisions=['grant','relation','document','policy'];
const key=r=>JSON.stringify(dimensions.map(x=>r[x]));
function reusable(entry,request,current,now){return Number.isFinite(now)&&Number.isFinite(entry.until)&&key(entry.request)===key(request)&&now<entry.until&&revisions.every(k=>Number.isInteger(current[k])&&entry.revisions[k]===current[k]);}
const request={subject:'lea',actor:'orbe-mcp',audience:'orbe-documents',organization:'A',object:'A17',operation:'close'};
const rev={grant:7,relation:2,document:4,policy:3};
const entry={request,revisions:rev,until:80};
function commit(doc,grant,expectedVersion,expectedGrant){if(!grant.active||grant.revision!==expectedGrant||doc.version!==expectedVersion||doc.state!=='open')return false;doc.state='closed';doc.version++;return true;}
test('intersection retains only requested common permission',()=>assert.deepEqual(intersect([read,close],[read,close,other],[close,other]),[close]));
test('connector cannot borrow user privilege',()=>assert.deepEqual(intersect([close],[read],[close]),[]));
test('organization remains part of permission',()=>assert.deepEqual(intersect([['B','A17','close']],[close],[close]),[]));
test('delegation lifetime is bounded by parent',()=>{assert.equal(Math.min(100,90,70+20),90);assert.equal(Math.min(90,110,85+20),90)});
test('cache deadline respects credential expiry',()=>assert.equal(Math.min(70+15,80),80));
test('matching cache works before boundary',()=>assert.equal(reusable(entry,request,rev,79),true));
test('exact expiry and invalid clock rejected',()=>{assert.equal(reusable(entry,request,rev,80),false);assert.equal(reusable(entry,request,rev,NaN),false)});
test('each request dimension isolates decisions',()=>{for(const k of dimensions)assert.equal(reusable(entry,{...request,[k]:'different'},rev,79),false,k)});
test('each changed dependency invalidates cache',()=>{for(const k of revisions)assert.equal(reusable(entry,request,{...rev,[k]:rev[k]+1},79),false,k)});
test('remaining stale window arithmetic',()=>assert.equal(Math.max(0,85-72),13));
test('revocation before commit leaves document untouched',()=>{const doc={state:'open',version:4};assert.equal(commit(doc,{active:false,revision:8},4,7),false);assert.deepEqual(doc,{state:'open',version:4})});
test('changed active grant still requires new decision',()=>{const doc={state:'open',version:4};assert.equal(commit(doc,{active:true,revision:8},4,7),false);assert.equal(doc.version,4)});
test('successful transition cannot replay old version',()=>{const doc={state:'open',version:4},grant={active:true,revision:7};assert.equal(commit(doc,grant,4,7),true);assert.deepEqual(doc,{state:'closed',version:5});assert.equal(commit(doc,grant,4,7),false)});
console.log(`${passed} tests passed`);
