const assert=require('node:assert/strict');
function near(a,b){assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);}
function softmax(s){const m=Math.max(...s);if(!Number.isFinite(m))throw Error('no finite score');const e=s.map(x=>Math.exp(x-m)),z=e.reduce((a,b)=>a+b,0);return e.map(x=>x/z);}
function attention(q,k,v,causal){return q.map((x,i)=>{const scores=k.map((y,j)=>causal&&j>i?-Infinity:x*y);const w=softmax(scores);return w.reduce((s,a,j)=>s+a*v[j],0);});}
let passed=0;function test(f){f();passed++;}
test(()=>{const w=softmax([0,Math.log(2),0]);w.forEach((x,i)=>near(x,[.25,.5,.25][i]));near(w.reduce((a,b)=>a+b),1);});
test(()=>attention([1,0,1],[0,Math.log(2),0],[2,6,10],false).forEach(x=>near(x,6)));
test(()=>attention([1,0,1],[0,Math.log(2),0],[2,6,10],true).forEach((x,i)=>near(x,[2,4,6][i])));
test(()=>{near(softmax([0,Math.log(2),0])[0]*2,.5);assert.notEqual(.5,2);});
test(()=>{softmax([1000,1001]).forEach((x,i)=>near(x,softmax([0,1])[i]));assert.throws(()=>softmax([-Infinity,-Infinity]));});
test(()=>{assert.equal(2048*2049/2,2098176);assert.equal(4096*4097/2,8390656);});
test(()=>{assert.equal(2048**2*2/2**20,8);assert.equal(4096**2*2/2**20,32);assert.equal(4*8*4096**2*2/2**30,1);});
test(()=>{assert.equal(256*2048**2,1073741824);assert.equal(256*4096**2,4294967296);});
test(()=>{const d=512,n=2048,L=24*n*d*d,A=4*n*n*d;near(A/(A+L),.4);near((2*L+4*A)/(L+A),2.8);});
test(()=>{for(const vals of [[2,6,10],[-5,1,7]])for(const y of attention([1,0,1],[0,Math.log(2),0],vals,true))assert.ok(y>=Math.min(...vals)&&y<=Math.max(...vals));});
console.log(passed+' tests passed; scalar attention and theoretical counts only');
