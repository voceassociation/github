import test from 'node:test';
import assert from 'node:assert/strict';
import {handleArtVault,isArtVaultPath,vaultLanguage} from '../art-vault-worker.js';

const password='a-long-random-test-password-with-32-bytes';
const account={username:'reviewer',password,dossiers:['seguso']};
const auth=(name='reviewer',pass=password)=>'Basic '+btoa(`${name}:${pass}`);
function fixture(users=[account]) {
  const reads=[];
  return {reads,env:{ART_VAULT_USERS:JSON.stringify(users),VOCE_CORPUS:{get:async key=>{
    reads.push(key); return {body:'PRIVATE-OBJECT',size:14};
  }}}};
}
const req=(path='',header,method='GET')=>new Request('https://voce.life/art/vault'+path,{method,headers:header?{authorization:header}:{}});

test('all vault aliases are intercepted, including static html and encoded names',()=>{
  for(const path of ['/art/vault','/art/vault.html','/art/vault/seguso/assets/a.jpg','/art/%76ault/seguso','/ART/VAULT']) assert.ok(isArtVaultPath(path),path);
  for(const path of ['/art','/art.html','/art/vaulter']) assert.equal(isArtVaultPath(path),false);
});
test('unconfigured or malformed accounts fail closed without storage access',async()=>{
  for(const secret of [undefined,'[]','bad JSON',JSON.stringify([{...account,password:'short'}])]) {
    const f=fixture();f.env.ART_VAULT_USERS=secret;
    assert.equal((await handleArtVault(req('/seguso',auth()),f.env)).status,503);
    assert.deepEqual(f.reads,[]);
  }
});
test('no credentials, wrong password and malformed base64 never read private bytes',async()=>{
  for(const header of [undefined,auth('reviewer','wrong'),auth('unknown'), 'Basic ???','Bearer token']) {
    const f=fixture();const res=await handleArtVault(req('/seguso/assets/seguso-01.jpg',header),f.env);
    assert.equal(res.status,401);assert.match(res.headers.get('www-authenticate'),/^Basic/);assert.deepEqual(f.reads,[]);
    assert.match(res.headers.get('cache-control'),/no-store/);assert.match(res.headers.get('x-robots-tag'),/noimageindex/);
  }
});
test('individual dossier authorisation and expiry deny private reads',async()=>{
  for(const user of [{...account,dossiers:['other']},{...account,expiresAt:'2020-01-01T00:00:00Z'}]) {
    const f=fixture([user]);assert.ok([401,404].includes((await handleArtVault(req('/seguso',auth()),f.env)).status));assert.deepEqual(f.reads,[]);
  }
});
test('successful document and image reads use only the authorised private prefix',async()=>{
  for(const [path,key,type] of [['/seguso','en.html','text/html'],['/seguso/assets/seguso-01.jpg','assets/seguso-01.jpg','image/jpeg'],['.html/seguso/seguso.json','seguso.json','application/json']]) {
    const f=fixture();const res=await handleArtVault(req(path,auth()),f.env);
    assert.equal(res.status,200);assert.match(res.headers.get('content-type'),new RegExp(type));assert.equal(await res.text(),'PRIVATE-OBJECT');
    assert.deepEqual(f.reads,['art-vault/seguso/'+key]);assert.match(res.headers.get('cache-control'),/private.*no-store/);
    assert.equal(res.headers.get('access-control-allow-origin'),null);
  }
});

test('language selection honours explicit files, language choice and weighted browser preferences',()=>{
  for(const [path,header,expected] of [['/seguso/it.html?lang=fr','en','it'],['?lang=fr','en','fr'],['','en;q=0.5,fr-CA;q=1,it;q=0.7','fr'],['','de,it-IT;q=0.8','it'],['?lang=unknown','de','en']]) {
    assert.equal(vaultLanguage(new Request('https://voce.life/art/vault'+path,{headers:{'accept-language':header}})),expected);
  }
});
test('all three languages apply to denied access, private index and default dossier routing',async()=>{
  for(const [lang,message,title] of [['fr','personnes autoris','Dossiers ouverts'],['en','Access is restricted','Dossiers available'],['it','Accesso riservato','Dossier disponibili']]) {
    const f=fixture();const url='https://voce.life/art/vault?lang='+lang;
    const denied=await handleArtVault(new Request(url),f.env);
    assert.equal(denied.status,401);assert.equal(denied.headers.get('content-language'),lang);assert.ok((await denied.text()).includes(message));assert.deepEqual(f.reads,[]);
    const allowed=await handleArtVault(new Request(url,{headers:{authorization:auth()}}),f.env);
    const body=await allowed.text();assert.ok(body.includes(String.fromCharCode(60)+`html lang="${lang}">`));assert.ok(body.includes(title));assert.ok(body.includes(`/seguso/${lang}.html`));
    await handleArtVault(new Request('https://voce.life/art/vault/seguso?lang='+lang,{headers:{authorization:auth()}}),f.env);
    assert.deepEqual(f.reads,[`art-vault/seguso/${lang}.html`]);
  }
});
test('HEAD has no response body, and unsafe methods or paths cannot read storage',async()=>{
  const f=fixture();assert.equal(await (await handleArtVault(req('/seguso',auth(),'HEAD'),f.env)).text(),'');
  for(const path of ['/seguso/%252e%252e/private','/seguso/file.js','/seguso/a%5cb.jpg']) {
    const g=fixture();assert.equal((await handleArtVault(req(path,auth()),g.env)).status,404);assert.deepEqual(g.reads,[]);
  }
  const g=fixture();assert.equal((await handleArtVault(req('/seguso',auth(),'POST'),g.env)).status,405);assert.deepEqual(g.reads,[]);
});
test('storage and rate-limit failures return closed responses',async()=>{
  const f=fixture();f.env.VOCE_CORPUS.get=async()=>{throw Error('no storage')};
  assert.equal((await handleArtVault(req('/seguso',auth()),f.env)).status,503);
  const g=fixture();g.env.ART_VAULT_LOGIN_LIMITER={limit:async()=>({success:false})};
  assert.equal((await handleArtVault(req('/seguso',auth()),g.env)).status,429);assert.deepEqual(g.reads,[]);
});
