const test=require('node:test'),assert=require('node:assert/strict');
const ratio=(a,b)=>b===0?null:a/b;
function metrics(rows){for(const r of rows){for(const k of ['P','E','U','X'])if(typeof r[k]!=='boolean')throw Error('missing boolean');if(r.E&&!r.P)throw Error('unobserved path');}const sum=k=>rows.filter(r=>r[k]).length;return {effect:ratio(sum('E'),rows.length),proposal:ratio(sum('P'),rows.length),exposed:ratio(rows.filter(r=>r.E&&r.X).length,sum('X')),contained:ratio(rows.filter(r=>r.P&&!r.E).length,sum('P')),utility:ratio(sum('U'),rows.length)};}
function upper(n){if(!Number.isInteger(n)||n<1)throw Error('invalid n');return -Math.expm1(Math.log(.05)/n);}
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-10);
const rows=Array.from({length:100},(_,i)=>({P:i<20,E:i<2,U:i>=30,X:i<80}));
test('distinct denominators',()=>{const m=metrics(rows);close(m.effect,.02);close(m.proposal,.2);close(m.exposed,.025);close(m.contained,.9);close(m.utility,.7);});
test('undefined is not perfect confinement',()=>{const m=metrics([{P:false,E:false,U:true,X:false}]);assert.equal(m.contained,null);assert.equal(m.exposed,null);});
test('empty sample is undefined',()=>assert.equal(metrics([]).effect,null));
test('inconsistent trace rejected',()=>assert.throws(()=>metrics([{P:false,E:true,U:true,X:true}]),/unobserved/));
test('missing observation rejected',()=>assert.throws(()=>metrics([{P:true,E:false,X:true}]),/missing/));
test('false positives and precision',()=>{close(ratio(90,100),.9);close(ratio(45,900),.05);close(ratio(90,135),2/3);});
test('prevalence changes predictive precision',()=>close(ratio(90,90+4995),.017699115044247787));
test('zero event bound satisfies probability equation',()=>{close(Math.pow(1-upper(100),100),.05);assert.ok(upper(100)>.029&&upper(100)<.030);assert.ok(upper(200)<upper(100));});
test('bound rejects zero or fractional sample size',()=>{for(const n of [0,-1,1.5,NaN])assert.throws(()=>upper(n));});
test('group and execution averages differ',()=>{close((1+0)/2,.5);close((1+0)/(1+9),.1);});
test('paired discordance counts',()=>{const pairs=[...Array(3).fill([1,0]),[0,1],...Array(2).fill([1,1]),...Array(14).fill([0,0])];const a=pairs.reduce((s,p)=>s+p[0],0),b=pairs.reduce((s,p)=>s+p[1],0);assert.equal(a,5);assert.equal(b,3);close((a-b)/pairs.length,.1);});
