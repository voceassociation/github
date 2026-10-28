const assert=require('node:assert/strict');
function near(a,b){assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);}
function cost(n,i,o,pi,po){if(![n,i,o,pi,po].every(x=>Number.isFinite(x)&&x>=0))throw Error('invalid');return n*(i*pi+o*po)/1e6;}
function useful(c,n){if(n<=0)throw Error('no accepted result');return c/n;}
let passed=0;function test(f){f();passed++;}
test(()=>{near(cost(200,900,150,2,8),.6);near(cost(200,1400,210,2,8),.896);});
test(()=>{near((.896-.6)/.6,.4933333333333333);near((.896-.6)/.896,.33035714285714285);});
test(()=>{near(.24/.6,.4);near(.336/.896,.375);});
test(()=>{near((1.5*280000-2*180000)/1e6,.06);near((2*100000+180000*(-.5)+(-.5)*100000)/1e6,.06);});
test(()=>{near(useful(.6,120),.005);near(useful(.896,190),.004715789473684211);assert.ok(useful(.896,190)<useful(.6,120));});
test(()=>assert.throws(()=>useful(1,0)));
test(()=>{const q=.6;near(1-(1-q)**2,.84);near(1+(1-q),1.4);near(200*(1-(1-q)**2),168);});
test(()=>{near(30/3600*30,.25);near((50+.6)/120,.4216666666666667);near((50+.896)/190,.2678736842105263);});
test(()=>{near(100/200,.5);near(100/20000,.005);});
test(()=>assert.throws(()=>cost(200,-1,150,2,8)));
// Artificial tokenizer: only 'ab' merges; deliberately not a production tokenizer.
function toy(s){return Array.from(s.replaceAll('ab','X'));}
test(()=>{assert.equal(toy('ab').length,1);assert.equal(toy('a').length+toy('b').length,2);});
console.log(passed+' tests passed');
