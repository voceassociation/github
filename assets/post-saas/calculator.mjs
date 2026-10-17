export const defaults = {users:50,seat:80,fixed:500,admin:800,saasGrowth:3,assessment:5000,implementation:35000,migration:10000,training:5000,coexist:3,legacyAdmin:800,hosting:300,maintenance:900,inference:200,retained:200,operations:800,opsGrowth:3};
export function calculate(input) {
 const x={};
 for(const key of Object.keys(defaults)) {
  const raw=input[key]; const n=Number(raw);
  if(raw===''||raw==null||!Number.isFinite(n)||n<0||n>1e9) throw new RangeError(key);
  x[key]=n;
 }
 if(!Number.isInteger(x.users)||!Number.isInteger(x.coexist)||x.coexist>36||x.saasGrowth>100||x.opsGrowth>100) throw new RangeError('range');
 const upfront=x.assessment+x.implementation+x.migration+x.training;
 let current=0, alternative=upfront;
 const rows=[];
 for(let month=1;month<=36;month++) {
  const year=Math.floor((month-1)/12);
  const subscriptions=(x.users*x.seat+x.fixed)*(1+x.saasGrowth/100)**year;
  const baseline=subscriptions+x.admin;
  const operating=(x.hosting+x.maintenance+x.inference+x.retained+x.operations)*(1+x.opsGrowth/100)**year;
  const overlap=month<=x.coexist?subscriptions+x.legacyAdmin:0;
  current+=baseline; alternative+=operating+overlap;
  rows.push({month,baseline,operating,overlap,investment:month===1?upfront:0,current,alternative});
 }
 const savings=current-alternative;
 // First crossover and durable payback differ if later inflation reverses the result.
 const first=rows.find(r=>r.current>=r.alternative)?.month??null;
 const durable=rows.find((r,i)=>rows.slice(i).every(a=>a.current>=a.alternative))?.month??null;
 const annual=[0,1,2].map(y=>{const rr=rows.slice(y*12,y*12+12);return {year:y+1,current:rr.reduce((s,r)=>s+r.baseline,0),alternative:rr.reduce((s,r)=>s+r.operating+r.overlap+r.investment,0)};});
 return {current,alternative,savings,percent:current?savings/current*100:null,first,durable,upfront,rows,annual};
}
export function csv(result) {
 return 'month,current_month_eur,alternative_operations_eur,coexistence_eur,investment_eur,current_cumulative_eur,alternative_cumulative_eur\r\n'+result.rows.map(r=>[r.month,...['baseline','operating','overlap','investment','current','alternative'].map(k=>r[k].toFixed(2))].join(',')).join('\r\n');
}
