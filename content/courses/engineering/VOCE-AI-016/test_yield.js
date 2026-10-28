// Synthetic production balances; node test_yield.js
function near(a,b){if(Math.abs(a-b)>1e-9)throw Error('numeric mismatch');}
function balance(n,first,reworked,recovered){
 if(![n,first,reworked,recovered].every(Number.isInteger)||n<=0||first<0||recovered<0||reworked<recovered||first>n||reworked>n-first)throw Error('invalid balance');
 return {final:first+recovered,remaining:n-first-recovered,firstYield:first/n,finalYield:(first+recovered)/n};
}
let passed=0;function test(f){f();passed++;}
test(()=>{const r=balance(1000,920,50,40);near(r.final,960);near(r.remaining,40);near(r.firstYield,.92);near(r.finalYield,.96);});
test(()=>{let rejected=false;try{balance(1000,920,90,40);}catch(e){rejected=true;}if(!rejected)throw Error('overcount');});
test(()=>{near(960/8,120);near(960/10,96);});
test(()=>near(60/(2+.05*2)*.96,27.428571428571));
test(()=>near(20+80-60,40));
test(()=>near((10000+50*10)/960,10.9375));
test(()=>{near((11-9)/(6*.2),5/3);near(Math.min(11-10.6,10.6-9)/(3*.2),2/3);});
test(()=>near((100*.9+900*.98)/1000,.972));
console.log(passed+' tests passed');
