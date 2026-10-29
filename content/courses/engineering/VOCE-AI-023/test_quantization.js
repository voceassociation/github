const assert=require('node:assert/strict');
const test=require('node:test');
function even(x){const f=Math.floor(x),d=x-f;return d<.5?f:d>.5?f+1:f%2===0?f:f+1;}
function quant(x,s,z,lo,hi){if(!Number.isFinite(x)||!Number.isFinite(s)||s<=0||![z,lo,hi].every(Number.isInteger)||lo>hi||z<lo||z>hi)throw Error('invalid quantizer');const q=Math.max(lo,Math.min(hi,even(x/s+z)));return {q,value:s*(q-z)};}
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-12,`${a} != ${b}`);
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
test('ties to even for both signs',()=>assert.deepEqual([2.5,3.5,-2.5,-3.5].map(even),[2,4,-2,-4]));
test('adjacent cells',()=>{close(quant(.62,.25,0,-7,7).value,.5);close(quant(.63,.25,0,-7,7).value,.75);});
test('affine zero and endpoints',()=>{assert.equal(quant(0,.2,5,0,15).q,5);close(quant(-1,.2,5,0,15).value,-1);close(quant(2,.2,5,0,15).value,2);});
test('rounding bound inside range',()=>{for(let i=-1750;i<=1750;i++){const x=i/1000;assert.ok(Math.abs(quant(x,.25,0,-7,7).value-x)<=.125+1e-12);}});
test('saturation exceeds rounding bound',()=>{close(quant(3,.25,0,-7,7).value,1.75);assert.ok(3-1.75>.125);close(quant(3,.5,0,-7,7).value,3);});
test('small weight error flips decision',()=>{const ref=.52-.51,q=quant(.52,.1,0,-127,127).value-.51;assert.ok(ref>0&&q<0);close(ref,.01);close(q,-.01);});
test('larger margin preserves decision',()=>{assert.ok(.52-.2>0);assert.ok(quant(.52,.1,0,-127,127).value-.2>0);});
test('linear bound from input norm',()=>{const x=[2,-1,.5],e=[.05,-.05,.05];close(.05*x.reduce((s,v)=>s+Math.abs(v),0),.175);close(dot(e,x),.175);});
test('two-sided perturbation includes cross term',()=>{const w=[2,3],x=[4,-1],e=[.1,-.2],f=[-.3,.4];const actual=dot(w.map((v,i)=>v+e[i]),x.map((v,i)=>v+f[i]))-dot(w,x);close(actual,dot(e,x)+dot(w,f)+dot(e,f));assert.ok(Math.abs(actual-dot(e,x)-dot(w,f))>.01);});
test('total memory differs from weight-only ratio',()=>{assert.equal((4e6+6e6)-(1e6+6e6),3e6);close(3e6/10e6,.3);});
test('invalid inputs rejected',()=>{for(const args of [[NaN,.1,0,-7,7],[1,0,0,-7,7],[1,-1,0,-7,7],[1,.1,9,-7,7]])assert.throws(()=>quant(...args));});
