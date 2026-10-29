const test=require('node:test'),a=require('node:assert/strict');
const softplus=x=>Math.max(0,x)+Math.log1p(Math.exp(-Math.abs(x)));
function loss(lw,ll,rw,rl,b=1){a.ok([lw,ll,rw,rl,b].every(Number.isFinite)&&b>0);return softplus(-b*((lw-rw)-(ll-rl)))}
const near=(x,y,t=1e-9)=>a.ok(Math.abs(x-y)<t,`${x} != ${y}`);
const l=Math.log;
test('normalized toy distribution and loss oracle',()=>{near(.2+.3+.5,1);near(loss(l(.2),l(.3),l(.1),l(.4)),l(11/8));a.ok(.2<.3)});
test('same model and reference give log two',()=>near(loss(-30,-3,-30,-3,.2),l(2)));
test('pair loss does not fix absolute mass',()=>near(loss(l(.02),l(.03),l(.1),l(.4)),loss(l(.2),l(.3),l(.1),l(.4))));
test('orientation changes margin',()=>near(loss(l(.3),l(.2),l(.4),l(.1)),l(11/3)));
test('gradient by finite differences',()=>{const e=1e-5,b=.2;near((loss(-2+e,-3,-2,-3,b)-loss(-2-e,-3,-2,-3,b))/(2*e),-.1);near((loss(-2,-3+e,-2,-3,b)-loss(-2,-3-e,-2,-3,b))/(2*e),.1)});
test('sequence product equals log sum',()=>near(l(.5)+l(.25)+l(.1),l(.0125)));
test('length averaging changes ordering',()=>{a.ok(-2>-3);a.ok(-2/2<-3/4)});
test('stable extreme margins',()=>{near(softplus(1000),1000);a.equal(softplus(-1000),0);a.ok(Number.isFinite(softplus(1000)))});
test('invalid input refused',()=>{a.throws(()=>loss(NaN,0,0,0));a.throws(()=>loss(0,0,0,0,0))});
