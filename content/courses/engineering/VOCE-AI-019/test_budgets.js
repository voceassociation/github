const assert=require('node:assert/strict');
function near(a,b){assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);}
let passed=0;function test(f){f();passed++;}
const n=4096,d=64,b=2,F=4*n*n*d,D=4*n*n*b;
test(()=>{assert.equal(n*n*b/2**20,32);assert.equal(2*n*n*b/2**20,64);assert.equal(D/2**20,128);});
test(()=>assert.equal(4*n*d*b/2**20,2));
test(()=>{assert.equal(F,4294967296);near(F/D,32);});
test(()=>{near(F/1e12*1000,4.294967296);near(D/1e11*1000,1.34217728);near((F/1e12+D/1e11)*1000,5.637144576);});
test(()=>{near((F/1e12+D/4/1e11)*1000,4.630511616);assert.equal(Math.max(F/1e12,D/1e11),Math.max(F/1e12,D/4/1e11));});
test(()=>near(Math.max(F/1e13,D/1e11)/Math.max(F/1e13,D/4/1e11),3.125));
test(()=>{near(70+30/4,77.5);near(100/77.5,1/(.7+.3/4));near(1/.7,1.4285714285714286);});
function close(y,r,a=1e-6,u=1e-5){return Number.isFinite(y)&&Number.isFinite(r)&&Math.abs(y-r)<=a+u*Math.abs(r);}
test(()=>{assert.ok(close(5e-7,0));assert.ok(!close(2e-6,0));assert.ok(close(100.001,100));assert.ok(!close(100.002,100));});
test(()=>{assert.ok(!close(NaN,NaN));assert.ok(!close(Infinity,Infinity));});
console.log(passed+' tests passed; theoretical budgets only');
