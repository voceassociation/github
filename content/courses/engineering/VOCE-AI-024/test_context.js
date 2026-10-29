const assert=require('node:assert/strict'),test=require('node:test');
function budget(l,h,o){if(![l,h,o].every(x=>Number.isInteger(x)&&x>=0)||h+o>l)throw Error('invalid budget');return l-h-o;}
function pack(items,b){const chosen=[];for(const x of items)if(x.cost<=b){chosen.push(x.id);b-=x.cost;}return chosen;}
function contains(a,b){return a[0]<=b[0]&&a[1]>=b[1];}
function active(d,t){return d.start<=t&&t<d.end;}
function stats(n,answered,correct){if(n<=0||correct<0||correct>answered||answered>n)throw Error('invalid counts');return {coverage:answered/n,precision:answered?correct/answered:null};}
const cost=(n,a,c,e)=>e*(a-c)+(n-a);
test('context budgets',()=>{assert.equal(budget(4096,700,600),2796);assert.equal(budget(4096,700,1200),2196);});
test('negative capacity rejected',()=>assert.throws(()=>budget(100,70,40)));
test('greedy ranking loses feasible evidence pair',()=>{assert.deepEqual(pack([{id:'P5',cost:400},{id:'P1',cost:250},{id:'P2',cost:250}],600),['P5']);assert.deepEqual(pack([{id:'P1',cost:250},{id:'P2',cost:250}],600),['P1','P2']);});
test('partial condition is not contained',()=>{assert.equal(contains([0,100],[80,140]),false);assert.equal(contains([0,140],[80,140]),true);});
test('validity intervals are half open',()=>{assert.equal(active({start:0,end:10},10),false);assert.equal(active({start:10,end:20},10),true);});
test('permutation keeps passage set',()=>assert.deepEqual(['P1','P2','P5'].sort(),['P5','P1','P2'].sort()));
test('coverage and conditional precision differ',()=>{assert.deepEqual(stats(100,60,54),{coverage:.6,precision:.9});assert.deepEqual(stats(100,80,68),{coverage:.8,precision:.85});});
test('no answers does not mean perfect precision',()=>assert.deepEqual(stats(100,0,0),{coverage:0,precision:null}));
test('cost preference depends on error weight',()=>{assert.equal(cost(100,60,54,5),70);assert.equal(cost(100,80,68,5),80);assert.equal(cost(100,60,54,2),52);assert.equal(cost(100,80,68,2),44);});
