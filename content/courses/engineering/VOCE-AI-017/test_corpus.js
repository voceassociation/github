const assert=require('node:assert/strict');
const encode=s=>Array.from(Buffer.from(s,'utf8'));
const decode=a=>new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(a));
function ratios(a,b){if(a.length!==b.length||!a.length||a.some(x=>!Number.isFinite(x)||x<=0)||b.some(x=>!Number.isFinite(x)||x<0))throw Error('invalid paired lengths');return {mean:a.reduce((s,x,i)=>s+b[i]/x,0)/a.length,total:b.reduce((s,x)=>s+x,0)/a.reduce((s,x)=>s+x,0)};}
let passed=0;function test(f){f();passed++;}function near(a,b){assert.ok(Math.abs(a-b)<1e-10);}
test(()=>{assert.equal(encode('é').length,2);assert.equal(encode('e\u0301').length,3);assert.equal(Array.from('é').length,1);assert.equal(Array.from('e\u0301').length,2);});
test(()=>assert.equal('é'.normalize('NFC'),'e\u0301'.normalize('NFC')));
test(()=>{assert.equal('①'.normalize('NFKC'),'1');assert.equal('①'.normalize('NFC'),'①');});
test(()=>{for(const x of ['é','e\u0301','①','café','中文']){const p=x.normalize('NFC');assert.equal(p.normalize('NFC'),p);assert.equal(decode(encode(p)),p);}});
test(()=>{assert.equal(encode('café').length,5);assert.equal(encode('cafe').length,4);});
test(()=>{const r=ratios([10,100],[20,110]);near(r.mean,1.55);near(r.total,130/110);});
test(()=>{assert.throws(()=>ratios([0,100],[20,110]));assert.throws(()=>ratios([10],[20,110]));});
test(()=>{near((10/110)*2+(100/110)*1.1,130/110);assert.deepEqual([20-10,110-100],[10,10]);});
console.log(JSON.stringify({tests_passed:passed,node:process.version,unicode:process.versions.unicode,scope:'UTF-8 byte tokenizer and synthetic inputs only'}));
