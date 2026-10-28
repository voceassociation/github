const assert=require('node:assert/strict');
function near(a,b){assert.ok(Math.abs(a-b)<1e-10);}
function row(q,k,v){const s=k.map(x=>q*x),m=Math.max(...s),w=s.map(x=>Math.exp(x-m)),z=w.reduce((a,b)=>a+b,0);return w.reduce((a,b,j)=>a+b*v[j],0)/z;}
class Cache{constructor(){this.reset();}reset(){this.k=[];this.v=[];}step(q,k,v){this.k.push(k);this.v.push(v);return row(q,this.k,this.v);}truncate(n){if(!Number.isInteger(n)||n<0||n>this.k.length)throw Error('invalid length');this.k.length=n;this.v.length=n;}}
const Q=[1,0,1,1],K=[0,Math.log(2),0,Math.log(3)],V=[2,6,10,14];
const full=v=>Q.map((q,i)=>row(q,K.slice(0,i+1),v.slice(0,i+1)));
let passed=0;function test(f){f();passed++;}
test(()=>{const c=new Cache();const ref=full(V);Q.forEach((q,i)=>{near(c.step(q,K[i],V[i]),ref[i]);assert.equal(c.k.length,i+1);assert.equal(c.v.length,i+1);});});
test(()=>full(V).forEach((x,i)=>near(x,[2,4,6,66/7][i])));
test(()=>{const a=full(V),b=full([2,6,10,999]);for(let i=0;i<3;i++)near(a[i],b[i]);assert.notEqual(a[3],b[3]);});
test(()=>{const c=new Cache();Q.forEach((q,i)=>c.step(q,K[i],V[i]));c.reset();near(c.step(Q[0],K[0],V[0]),2);assert.equal(c.k.length,1);});
test(()=>{const c=new Cache();Q.forEach((q,i)=>c.step(q,K[i],V[i]));c.truncate(3);near(c.step(Q[3],K[3],V[3]),66/7);assert.throws(()=>c.truncate(5));});
test(()=>{let n=1000,m=100;assert.equal(Array.from({length:m},(_,i)=>n+i+1).reduce((a,b)=>a+b),m*n+m*(m+1)/2);assert.equal(m*n+m*(m+1)/2,105050);});
test(()=>{const bytesPerPosition=2*32*8*128*2;assert.equal(bytesPerPosition,131072);assert.equal(bytesPerPosition*4096/2**20,512);assert.equal(bytesPerPosition*4096*4/2**30,2);});
test(()=>{const b=131072;assert.equal(b*(1024+4096)/2**20,640);assert.equal(b*4096*2/2**20,1024);});
console.log(passed+' cache tests passed; scalar simulation only');
