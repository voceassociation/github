const test=require('node:test'),assert=require('node:assert/strict');
const ctx={verified:true,subject:'lea',aud:'orbe-mcp',exp:100,scopes:['dossier:read','dossier:close']};
const memberships={lea:'A'};
const fresh=()=>({id:'A17',org:'A',readers:['lea'],owners:['lea'],state:'open',version:4});
function valid(c,now){return c.verified===true&&c.aud==='orbe-mcp'&&Number.isFinite(now)&&Number.isFinite(c.exp)&&c.exp>now;}
function permit(c,d,op,now){return valid(c,now)&&c.scopes.includes('dossier:'+op)&&memberships[c.subject]===d.org&&(op==='read'?d.readers: d.owners).includes(c.subject);}
function close(c,d,a,now){if(!a||Object.keys(a).sort().join(',')!=='document_id,expected_version'||typeof a.document_id!=='string'||!Number.isInteger(a.expected_version))return false;if(a.document_id!==d.id||!permit(c,d,'close',now)||d.state!=='open'||a.expected_version!==d.version)return false;d.state='closed';d.version++;return true;}
test('authorized read',()=>assert.ok(permit(ctx,fresh(),'read',10)));
test('cross organization denied even with relation',()=>assert.equal(permit(ctx,{...fresh(),org:'B'},'read',10),false));
test('missing object relation denied',()=>assert.equal(permit(ctx,{...fresh(),readers:[]},'read',10),false));
test('wrong audience denied',()=>assert.equal(permit({...ctx,aud:'other'},fresh(),'read',10),false));
test('exact expiry denied',()=>assert.equal(permit(ctx,fresh(),'read',100),false));
test('unverified context denied',()=>assert.equal(permit({...ctx,verified:false},fresh(),'read',10),false));
test('scope does not imply another scope',()=>assert.equal(permit({...ctx,scopes:['dossier:close']},fresh(),'read',10),false));
test('close transition and stale retry',()=>{const d=fresh(),a={document_id:'A17',expected_version:4};assert.ok(close(ctx,d,a,10));assert.equal(d.version,5);assert.equal(d.state,'closed');assert.equal(close(ctx,d,a,10),false);assert.equal(d.version,5);});
test('nonowner cannot mutate',()=>{const d={...fresh(),owners:[]},before=JSON.stringify(d);assert.equal(close(ctx,d,{document_id:'A17',expected_version:4},10),false);assert.equal(JSON.stringify(d),before);});
test('stale or malformed args have no effect',()=>{for(const a of [{document_id:'A17',expected_version:3},{document_id:'A17',expected_version:'4'},{document_id:'A17',expected_version:4,force:true}]){const d=fresh();assert.equal(close(ctx,d,a,10),false);assert.deepEqual(d,fresh());}});
