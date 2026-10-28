const test=require('node:test'),assert=require('node:assert/strict');
const mv=(m,x)=>m.map(row=>row.reduce((s,z,i)=>s+z*x[i],0));
const mm=(a,b)=>a.map(row=>b[0].map((_,j)=>row.reduce((s,z,k)=>s+z*b[k][j],0)));
const add=(a,b)=>a.map((row,i)=>row.map((z,j)=>z+b[i][j]));
const scale=(a,s)=>a.map(row=>row.map(z=>s*z));
const W=[[1,0,-1],[0,2,1]],A=[[1,-1,2]],B=[[2],[-1]],x=[3,1,-2],s=.5;
const fused=add(W,scale(mm(B,A),s));
function separate(x){const y=mv(W,x),z=mv(B,mv(A,x));return y.map((v,i)=>v+s*z[i]);}
const params=(d,k,r)=>{assert.ok([d,k,r].every(n=>Number.isInteger(n)&&n>0));return r*(d+k)};
function near(a,b){assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`)}
test('hand oracle and fused matrix',()=>{assert.deepEqual(separate(x),[3,1]);assert.deepEqual(fused,[[2,-1,1],[-.5,2.5,0]]);assert.deepEqual(mv(fused,x),[3,1]);});
test('basis inputs compare complete linear map',()=>{for(const e of [[1,0,0],[0,1,0],[0,0,1]])assert.deepEqual(separate(e),mv(fused,e));});
test('scale omitted and double correction are detected',()=>{assert.deepEqual(mv(add(W,mm(B,A)),x),[1,2]);assert.deepEqual(mv(add(fused,scale(mm(B,A),s)),x),[1,2]);});
test('factor nonuniqueness',()=>assert.deepEqual(mm(scale(B,2),scale(A,.5)),mm(B,A)));
test('rank one correction does not imply rank one adapted matrix',()=>{const d=mm(B,A);assert.equal(d[0][0]*d[1][1]-d[0][1]*d[1][0],0);assert.equal(fused[0][0]*fused[1][1]-fused[0][1]*fused[1][0],4.5);});
test('square and rectangular counts',()=>{assert.equal(params(4096,4096,8),65536);assert.equal(params(4096,4096,32),262144);assert.equal(params(11008,4096,8),120832);assert.equal(11008*4096,45088768);assert.equal(65536/(4096**2),1/256);});
test('small rank can still cost more',()=>{assert.equal(params(2,3,1),5);assert.equal(params(2,3,2),10);assert.ok(10>2*3);assert.throws(()=>params(2,3,0));});
test('module and byte budgets',()=>{const n=64*params(4096,4096,8);assert.equal(n,4194304);assert.equal(n*2/2**20,8);assert.equal(n*16/2**20,64);assert.equal(64*params(4096,4096,32),16777216);});
test('scalar gradients checked by central differences',()=>{const loss=(a,b)=>.5*(b*a*2-1)**2;const a=3,b=.4,e=1e-5,g=b*a*2-1;near((loss(a+e,b)-loss(a-e,b))/(2*e),g*b*2);near((loss(a,b+e)-loss(a,b-e))/(2*e),g*a*2);});
test('zero initialization and excessive step',()=>{const grad=(a,b)=>{const g=b*a*2-1;return[g*b*2,g*a*2]};assert.deepEqual(grad(3,0).map(z=>z===0?0:z),[0,-6]);assert.deepEqual(grad(0,0).map(z=>z===0?0:z),[0,0]);const b=.6,y=b*3*2;near(y,3.6);near(.5*(y-1)**2,3.38);});
