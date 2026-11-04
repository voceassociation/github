const assert=require('node:assert/strict');const {test}=require('node:test');
// Sequential in-memory provider. Never contacts a payment API.
class Provider{
 constructor(){this.memo=new Map();this.effects=[];this.paid=new Map([['A:P8',12000],['B:P8',12000]]);}
 call(key,r){if(!Number.isSafeInteger(r.amount)||r.amount<=0||r.currency!=='EUR')throw Error('invalid');const id=JSON.stringify([r.account,key]);const fp=JSON.stringify([r.account,r.payment,r.amount,r.currency,r.approval]);if(this.memo.has(id)){const old=this.memo.get(id);if(old.fp!==fp)throw Error('conflict');return old.result;}
 const payment=r.account+':'+r.payment;const paid=this.paid.get(payment);if(paid===undefined)throw Error('payment');const spent=this.effects.filter(x=>x.account===r.account&&x.payment===r.payment).reduce((s,x)=>s+x.amount,0);if(spent+r.amount>paid)throw Error('balance');const result={id:'refund-'+(this.effects.length+1)};this.effects.push({...r,...result});this.memo.set(id,{fp,result});return result;}
}
const req={account:'A',payment:'P8',amount:3000,currency:'EUR',approval:'R17'};
test('identical retry returns same object and one effect',()=>{const p=new Provider();const a=p.call('K17',req);assert.equal(p.call('K17',req).id,a.id);assert.equal(p.effects.length,1)});
test('lost response after effect then retry',()=>{const p=new Provider();assert.throws(()=>{p.call('K17',req);throw Error('timeout')},/timeout/);assert.equal(p.call('K17',req).id,'refund-1');assert.equal(p.effects.length,1)});
test('new key after lost response creates duplicate counterexample',()=>{const p=new Provider();p.call('K17',req);p.call('K18',req);assert.equal(p.effects.length,2)});
test('changed amount conflicts without effect',()=>{const p=new Provider();p.call('K17',req);assert.throws(()=>p.call('K17',{...req,amount:3500}),/conflict/);assert.equal(p.effects.length,1)});
test('changed payment or approval conflicts',()=>{for(const delta of [{payment:'P9'},{approval:'R18'}]){const p=new Provider();p.call('K17',req);assert.throws(()=>p.call('K17',{...req,...delta}),/conflict/);assert.equal(p.effects.length,1)}});
test('scope separates merchants',()=>{const p=new Provider();p.call('K17',req);p.call('K17',{...req,account:'B'});assert.equal(p.effects.length,2)});
test('new legitimate partial refund then ceiling',()=>{const p=new Provider();p.call('K17',req);p.call('K18',{...req,amount:2000,approval:'R18'});assert.throws(()=>p.call('K19',{...req,amount:8000,approval:'R19'}),/balance/);assert.equal(p.effects.reduce((s,x)=>s+x.amount,0),5000)});
test('integer positive amounts only',()=>{for(const amount of [0,-1,1.5,NaN,Infinity])assert.throws(()=>new Provider().call('K17',{...req,amount}),/invalid/)});
test('parameter order and transport diagnostics do not change intent',()=>{const p=new Provider();const a=p.call('K17',req);assert.equal(p.call('K17',{approval:'R17',currency:'EUR',amount:3000,payment:'P8',account:'A',attempt:2}).id,a.id)});
test('pruned deduplication can permit another effect',()=>{const p=new Provider();p.call('K17',req);p.memo.clear();p.call('K17',req);assert.equal(p.effects.length,2)});
