const assert=require('node:assert/strict');
const test=require('node:test');
function summary(x,v,mask=x.map(()=>true)){
 assert.equal(x.length,v.length);assert.equal(x.length,mask.length);
 const ids=x.map((_,i)=>i).filter(i=>mask[i]);if(!ids.length)return null;
 const d=v[ids[0]].length;assert.ok(d>0);
 for(const i of ids){assert.ok(Number.isFinite(x[i]));assert.equal(v[i].length,d);v[i].forEach(z=>assert.ok(Number.isFinite(z)));}
 const m=Math.max(...ids.map(i=>x[i])),w=ids.map(i=>Math.exp(x[i]-m));
 return {m,l:w.reduce((a,b)=>a+b,0),u:Array.from({length:d},(_,k)=>ids.reduce((s,i,j)=>s+w[j]*v[i][k],0))};
}
function merge(a,b){if(!a)return b;if(!b)return a;assert.equal(a.u.length,b.u.length);const m=Math.max(a.m,b.m),f=Math.exp(a.m-m),g=Math.exp(b.m-m);return {m,l:f*a.l+g*b.l,u:a.u.map((z,k)=>f*z+g*b.u[k])};}
function finish(s){assert.ok(s,'empty permitted set');return s.u.map(z=>z/s.l);}
function blocked(x,v,size,mask=x.map(()=>true)){assert.ok(Number.isInteger(size)&&size>0);let s=null;for(let i=0;i<x.length;i+=size)s=merge(s,summary(x.slice(i,i+size),v.slice(i,i+size),mask.slice(i,i+size)));return finish(s);}
function reference(x,v,mask=x.map(()=>true)){const ids=x.map((_,i)=>i).filter(i=>mask[i]);assert.ok(ids.length);const m=Math.max(...ids.map(i=>x[i]));const weights=ids.map(i=>Math.exp(x[i]-m));const den=weights.reduce((a,b)=>a+b,0);return v[0].map((_,k)=>ids.reduce((s,i,j)=>s+(weights[j]/den)*v[i][k],0));}
function close(a,b){assert.equal(a.length,b.length);a.forEach((z,i)=>assert.ok(Number.isFinite(z)&&Math.abs(z-b[i])<=1e-11+1e-11*Math.abs(b[i]),`${z} vs ${b[i]}`));}
const x=[0,Math.log(2),Math.log(4)],v=[[2],[5],[-1]];
test('analytic 8/7 and local states',()=>{const a=summary(x.slice(0,2),v.slice(0,2));close([a.l,...a.u],[1.5,6]);close(blocked(x,v,2),[8/7]);});
test('mask oracle -2/5',()=>close(blocked(x,v,2,[true,false,true]),[-2/5]));
test('all partitions and incomplete last block',()=>{const s=[-3,4,0,2,-1,7,1],w=s.map((_,i)=>[i-3,2*i]);for(let b=1;b<=8;b++)close(blocked(s,w,b),reference(s,w));});
test('translation 1000 avoids raw overflow',()=>{assert.equal(Math.exp(1000),Infinity);close(blocked(x.map(z=>z+1000),v,2),[8/7]);});
test('empty block identity',()=>close(blocked(x,v,1,[false,false,true]),[-1]));
test('entirely masked line rejected',()=>assert.throws(()=>blocked(x,v,2,[false,false,false])));
test('associativity and reversed block order',()=>{const a=summary([x[0]],[v[0]]),b=summary([x[1]],[v[1]]),c=summary([x[2]],[v[2]]);close(finish(merge(merge(a,b),c)),finish(merge(a,merge(b,c))));close(finish(merge(c,merge(b,a))),[8/7]);});
test('equal logits produce vector mean',()=>close(blocked([2,2,2],[[3,6],[-3,0],[9,-3]],2),[3,1]));
test('signed cancellation',()=>close(blocked([0,0],[[1e12],[-1e12]],1),[0]));
test('invalid finite input contract',()=>{assert.throws(()=>blocked([NaN],[[1]],1));assert.throws(()=>blocked([0],[[Infinity]],1));assert.throws(()=>blocked([0],[[1]],0));});
test('naive state fusion is distinguishable',()=>{const a=summary(x.slice(0,2),v.slice(0,2)),b=summary(x.slice(2),v.slice(2));assert.ok(Math.abs((a.u[0]+b.u[0])/(a.l+b.l)-8/7)>.1);});
test('tile budget and extra score buffer',()=>{const q=16*64*2,k=32*64*2,val=k,s=16*32*4,u=16*64*4,stats=2*16*4;assert.equal(q+k+val+s+u+stats,16512);assert.equal(q+k+val+2*s+u+stats,18560);});
