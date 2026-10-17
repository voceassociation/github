import {calculate,csv,defaults} from './calculator.mjs';
let values={...defaults},result,copy,busy=false;
const $=id=>document.getElementById('ps-'+id);
function init(){
 copy=JSON.parse($('copy').textContent);
 for(const [k,v] of Object.entries(values)) $('form').elements[k].value=v;
 $('form').addEventListener('submit',e=>e.preventDefault());
 $('form').addEventListener('input',()=>{for(const k of Object.keys(defaults))values[k]=$('form').elements[k].value; render();});
 $('export').onclick=()=>{if(!result)return;const blob=new Blob(['\ufeff'+csv(result)],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='voce-post-saas-36-months.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 render();
}
function render(){
 const money=n=>new Intl.NumberFormat(document.documentElement.lang,{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n);
 try{if(!$('form').checkValidity())throw Error('invalid');result=calculate(values);}catch{result=null;$('error').textContent=copy.invalid;$('output').hidden=true;$('export').disabled=true;return;}
 $('error').textContent='';$('output').hidden=false;$('export').disabled=false;
 $('current').textContent=money(result.current);$('alternative').textContent=money(result.alternative);
 const label=n=>Math.abs(n)<.005?copy.equal:n>0?copy.saving:copy.extra;
 $('diff-label').textContent=label(result.savings);$('difference').textContent=money(Math.abs(result.savings));
 $('percent').textContent=result.percent===null?copy.zero:new Intl.NumberFormat(document.documentElement.lang,{maximumFractionDigits:1}).format(Math.abs(result.percent))+' %';
 $('payback').textContent=copy.payback+': '+(result.first??copy.none)+'. '+(result.first!==null&&result.durable!==result.first?copy.durable+': '+(result.durable??copy.none)+'.':'');
 $('annual').replaceChildren(...result.annual.map(r=>{const tr=document.createElement('tr');[r.year,money(r.current),money(r.alternative),money(r.current-r.alternative)].forEach((v,i)=>{const td=document.createElement(i?'td':'th');if(!i)td.scope='row';td.textContent=v;tr.append(td);});return tr;}));
 const stress=calculate({...values,migration:Number(values.migration)*1.2,coexist:Math.min(36,Number(values.coexist)+6)});
 $('stress').textContent=label(stress.savings)+' '+money(Math.abs(stress.savings));
 const max=Math.max(result.current,result.alternative,1);const x=m=>95+m/36*600,y=v=>230-v/max*190;
 const series=[{month:0,current:0,alternative:result.upfront},...result.rows];
 const svg=$('chart');svg.replaceChildren();
 const add=(tag,attrs,text)=>{const el=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,v);if(text)el.textContent=text;svg.append(el);};
 add('title',{},copy.calcTitle);add('desc',{},copy.current+': '+money(result.current)+'. '+copy.alternative+': '+money(result.alternative));
 for(const f of [0,.5,1]){add('line',{x1:95,x2:695,y1:y(max*f),y2:y(max*f),stroke:'#d9d8d1'});add('text',{x:90,y:y(max*f)+5,'text-anchor':'end'},new Intl.NumberFormat(document.documentElement.lang,{notation:'compact',maximumFractionDigits:1}).format(max*f)+' €');}
 for(const m of [0,12,24,36])add('text',{x:x(m),y:260,'text-anchor':'middle'},String(m));
 for(const [key,color,dash]of [['current','#123e33',''],['alternative','#8d562a','7 5']])add('polyline',{points:series.map(r=>`${x(r.month)},${y(r[key])}`).join(' '),fill:'none',stroke:color,'stroke-width':3,'stroke-dasharray':dash});
}
async function language(url,push=true){
 if(busy)return;busy=true;
 try{
  const response=await fetch(url,{credentials:'same-origin'});if(!response.ok)throw Error('load');
  const doc=new DOMParser().parseFromString(await response.text(),'text/html');if(!doc.getElementById('ps-copy'))throw Error('page');
  for(const selector of ['main','header','footer','#ps-copy'])document.querySelector(selector).replaceWith(doc.querySelector(selector));
  document.documentElement.lang=doc.documentElement.lang;document.title=doc.title;
  for(const selector of ['link[rel="canonical"]','meta[name="description"]','meta[property="og:title"]','meta[property="og:description"]','meta[property="og:url"]','meta[name="twitter:title"]','meta[name="twitter:description"]'])document.querySelector(selector)?.replaceWith(doc.querySelector(selector));
  if(push)history.pushState(null,'',url);
  init();document.querySelector('.lang a.active')?.focus({preventScroll:true});
 }catch{location.assign(url);}finally{busy=false;}
}
document.addEventListener('click',e=>{const a=e.target.closest('.lang a');if(!a||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||e.button!==0)return;const url=new URL(a.href);if(!/\/applied\/post-saas\/?$/.test(url.pathname))return;e.preventDefault();language(url.href);});
window.addEventListener('popstate',()=>language(location.href,false));
init();
