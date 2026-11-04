// Internal verified-context model, NOT a JWT verifier or a network service.
const assert=require('node:assert/strict');
const {test}=require('node:test');
function audiences(a){if(typeof a==='string'&&a.length)return [a];if(Array.isArray(a)&&a.length&&a.every(x=>typeof x==='string'&&x.length))return a;return null;}
function admit(c,service,now){const a=audiences(c.aud);return c.verified===true&&c.issuer==='auth.meridien.example'&&a!==null&&a.includes(service)&&c.category==='access'&&Number.isFinite(now)&&Number.isFinite(c.nbf)&&Number.isFinite(c.exp)&&c.nbf<=now&&now<c.exp&&Array.isArray(c.scopes)&&c.scopes.includes('read');}
const base={verified:true,issuer:'auth.meridien.example',aud:'api-notes',category:'access',nbf:100,exp:160,scopes:['read']};
test('nominal destination',()=>assert.equal(admit(base,'api-notes',120),true));
test('same issuer and scope cannot authorize another destination',()=>assert.equal(admit(base,'api-factures',120),false));
test('absent or malformed audiences fail closed',()=>{for(const aud of [undefined,null,[],42,['api-notes',1],{},''])assert.equal(admit({...base,aud},'api-notes',120),false)});
test('exact membership, never substring',()=>assert.equal(admit({...base,aud:'api-notes-archive'},'api-notes',120),false));
test('explicit multi-audience accepted by this profile',()=>assert.equal(admit({...base,aud:['api-notes','api-factures']},'api-factures',120),true));
test('untrusted issuer with correct audience fails',()=>assert.equal(admit({...base,issuer:'foreign'},'api-notes',120),false));
test('login context is not API access',()=>assert.equal(admit({...base,category:'login'},'api-notes',120),false));
test('unverified context fails',()=>assert.equal(admit({...base,verified:false},'api-notes',120),false));
test('time boundaries',()=>{assert.equal(admit(base,'api-notes',99),false);assert.equal(admit(base,'api-notes',100),true);assert.equal(admit(base,'api-notes',159),true);assert.equal(admit(base,'api-notes',160),false)});
test('invalid time rejected',()=>{assert.equal(admit(base,'api-notes',NaN),false);assert.equal(admit({...base,exp:Infinity},'api-notes',120),false)});
test('scope remains independent',()=>assert.equal(admit({...base,scopes:['export']},'api-notes',120),false));
test('three services: three diagonal admissions and six refusals',()=>{const services=['api-notes','api-factures','api-annuaire'];let positives=0;for(const aud of services)for(const target of services){const result=admit({...base,aud},target,120);assert.equal(result,aud===target);positives+=Number(result)}assert.equal(positives,3)});
