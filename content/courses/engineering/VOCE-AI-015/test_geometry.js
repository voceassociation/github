// Synthetic geometry only; run with: node test_geometry.js
function near(a,b){if(Math.abs(a-b)>1e-9)throw Error('numeric mismatch');}
function transform(u,v,x,y,t){return [x+u*Math.cos(t)-v*Math.sin(t),y+u*Math.sin(t)+v*Math.cos(t)];}
function width(l,w,t){return Math.abs(l*Math.sin(t))+Math.abs(w*Math.cos(t));}
let passed=0;
function test(f){f();passed++;}
test(()=>{const p=transform(1,0,2,1,Math.PI/2);near(p[0],2);near(p[1],2);});
test(()=>{const p=transform(.3,-.2,2,1,.4);const q=transform(p[0]-2,p[1]-1,0,0,-.4);near(q[0],.3);near(q[1],-.2);});
test(()=>near(width(.8,.6,0),.6));
test(()=>near(width(.8,.6,Math.PI/2),.8));
test(()=>near(width(.8,.6,Math.PI/4),1.4/Math.sqrt(2)));
test(()=>near(Math.hypot(.8,.6),1));
test(()=>near((1.4-2*.02)-(1+2*.05),.26));
test(()=>near((10/.05)*(8/.05),32000));
console.log(passed+' tests passed');
