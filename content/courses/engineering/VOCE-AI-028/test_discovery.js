// Synthetic configuration model: no HTTP, TLS, proxy or token verification.
const assert=require('node:assert/strict');const {test}=require('node:test');
const facts={resource:'https://services.meridien.example/factures/mcp',issuer:'https://auth.meridien.example',audience:'api-factures',backend:'factures-v1',version:4};
function select(doc,c){return doc.resource===c.resource&&Array.isArray(doc.authorization_servers)&&doc.authorization_servers.length>0&&doc.authorization_servers.every(x=>typeof x==='string'&&x.length>0)&&doc.authorization_servers.includes(c.issuer)?c.issuer:null;}
function coherent(actual,c){return ['resource','issuer','audience','backend'].every(k=>actual[k]===c[k]);}
function reusable(e,c,now){return Number.isFinite(now)&&Number.isFinite(e.until)&&now<e.until&&e.resource===c.resource&&e.version===c.version&&select(e.doc,c)!==null;}
const doc={resource:facts.resource,authorization_servers:[facts.issuer]};
const entry={resource:facts.resource,version:4,until:260,doc};
test('nominal discovery selects configured authority',()=>assert.equal(select(doc,facts),facts.issuer));
test('wrong resource rejected',()=>assert.equal(select({...doc,resource:'notes'},facts),null));
test('foreign authority rejected',()=>assert.equal(select({...doc,authorization_servers:['foreign']},facts),null));
test('configured authority selected even when not first',()=>assert.equal(select({...doc,authorization_servers:['other',facts.issuer]},facts),facts.issuer));
test('malformed lists rejected',()=>{for(const x of [[],null,facts.issuer,[facts.issuer,4]])assert.equal(select({...doc,authorization_servers:x},facts),null)});
test('each broken deployment link detected',()=>{assert.equal(coherent(facts,facts),true);for(const k of ['resource','issuer','audience','backend'])assert.equal(coherent({...facts,[k]:'wrong'},facts),false)});
test('shared host does not share cache entry',()=>assert.equal(reusable(entry,{...facts,resource:'https://services.meridien.example/notes/mcp'},230),false));
test('cache usable before expiry but not at boundary',()=>{assert.equal(reusable(entry,facts,259),true);assert.equal(reusable(entry,facts,260),false)});
test('policy revision invalidates remaining lifetime',()=>assert.equal(reusable(entry,{...facts,version:5},250),false));
test('nonfinite clock rejected',()=>assert.equal(reusable(entry,facts,NaN),false));
test('backend-only migration preserves audience contract',()=>{const next={...facts,backend:'factures-v2',version:5};assert.equal(coherent(next,next),true);assert.equal(coherent({...next,audience:'api-notes'},next),false)});
