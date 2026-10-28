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

// Chapter 02: synthetic calculations and boundary checks.
test(()=>{near(79/120,.6583333333333333);near(100/120,5/6);if(!(19/20>90/100&&60/100>10/20&&79/120<100/120))throw Error('reversal');});
test(()=>{near((.95+.60)/2,.775);near((.90+.50)/2,.70);});
function mean(a){return a.reduce((s,x)=>s+x,0)/a.length;}
function variance(a){const m=mean(a);return a.reduce((s,x)=>s+(x-m)**2,0)/(a.length-1);}
test(()=>{const d=[3,1,4,2];near(mean(d),2.5);near(variance(d),5/3);near(Math.sqrt(variance(d)/4),.6454972243679028);});
test(()=>{const a=[10.01,10.02,10],b=[10.21,10.22,10.20];near(mean(b)-mean(a),.2);near(variance(a),.0001);near(variance(a),variance(b));});
function pieceSD(total,measurement){const v=total**2-measurement**2;if(v<0)throw Error('incompatible variance estimates');return Math.sqrt(v);}
test(()=>near(pieceSD(.1,.06),.08));
test(()=>{let rejected=false;try{pieceSD(.04,.06);}catch(e){rejected=true;}if(!rejected)throw Error('negative variance hidden');});
function accepted(y,u){return y-u>=9&&y+u<=11;}
test(()=>{if(!accepted(10.90,.08)||accepted(10.95,.08))throw Error('decision');});
test(()=>{if(!accepted(9.08,.08)||!accepted(10.92,.08)||accepted(9.079,.08)||accepted(10.921,.08))throw Error('boundary');});
console.log(passed+' total tests passed');
